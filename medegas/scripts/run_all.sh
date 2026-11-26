#!/usr/bin/env bash
# Regenera tudo a partir de scripts/params.py:
#   modelos FCStd + verificação de interferências + PNG -> desenhos/PDF -> STEP/STL/DXF -> FEM
#
# Uso:  ./scripts/run_all.sh            (tudo)
#       ./scripts/run_all.sh --sem-fem  (pula o FEM, que leva ~10 min)
#       MEDEGAS_SET="D_ext=380,r_sens=145" ./scripts/run_all.sh
#
# FREECAD_BIN aponta para o diretório com `freecad` e `freecadcmd` (FreeCAD >= 1.1).
# Em servidor sem tela o GUI roda sob xvfb-run (precisa para cores, PNG e PDF).
set -euo pipefail
cd "$(dirname "$0")/.."
FC_BIN="${FREECAD_BIN:-/opt/fc/bin}"
export LANG=C.UTF-8 LC_ALL=C.UTF-8 MEDEGAS_BATCH=1
GUI=("$FC_BIN/freecad")
if [ -z "${DISPLAY:-}" ]; then GUI=(xvfb-run -a -s "-screen 0 1920x1440x24" "$FC_BIN/freecad"); fi

step() { echo; echo "== $*"; }
step "Arquitetura A";  "${GUI[@]}" scripts/create_architecture_a.py >/dev/null 2>&1
step "Arquitetura B";  "${GUI[@]}" scripts/create_architecture_b.py >/dev/null 2>&1
step "Modelo mestre";  "${GUI[@]}" scripts/create_master_model.py  >/dev/null 2>&1
step "Desenhos/PDF";   mkdir -p freecad/drawings; "${GUI[@]}" scripts/make_drawings.py >/dev/null 2>&1
cat freecad/drawings/make_drawings.log
step "STEP/STL/DXF";   "$FC_BIN/freecadcmd" scripts/export_models.py 2>&1 | grep -E "^\| |falhou|Error" || true
if [ "${1:-}" != "--sem-fem" ]; then
  step "FEM (CalculiX)"; "$FC_BIN/freecadcmd" scripts/fem_study.py >/dev/null 2>&1
  grep -A12 "## Resultados" validation/fem_resultados.md
fi
step "Interferencias"; grep -h -E "Altura total|Nenhuma interfer|\*\*.* × |Menor folga" validation/interferencias_*.md
