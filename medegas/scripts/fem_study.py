# -*- coding: utf-8 -*-
"""Estudo FEM (CalculiX via FreeCAD FEM) da placa estrutural superior.

Executar: freecadcmd scripts/fem_study.py
Saída: freecad/fem/FEM_*.FCStd (análises abertas no FreeCAD) e
       validation/fem_resultados.md + validation/fem_resultados.json

Escopo DELIBERADAMENTE limitado (ver docs/riscos-e-validacoes.md):
- só a placa superior (alumínio), linear elástico, pequenos deslocamentos;
- sensor/célula modelados como apoio rígido (a deflexão do próprio sensor
  soma-se à da placa e precisa ser medida no ensaio);
- carga do botijão como pressão uniforme sobre a projeção do anel de base
  (a tampa impressa entre os dois é ignorada);
- propriedades de material = valores típicos de handbook, não de certificado.
"""
import json
import math
import os
import re
import sys

import FreeCAD as App
import ObjectsFem
import Part

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from params import p, loads, stops_of  # noqa: E402

V = App.Vector
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "freecad", "fem")
WORK = os.path.join(OUT, "_ccx")

AL5052 = {"Name": "Al 5052-H32 (valores tipicos)", "YoungsModulus": "70300 MPa", "PoissonRatio": "0.33",
          "Density": "2680 kg/m^3"}
SY_AL5052 = 193.0  # MPa, limite de escoamento típico (handbook) - confirmar com certificado
MESH_MAX = float(os.environ.get("MEDEGAS_FEM_MESH", "5.0"))


# ---------------------------------------------------------------- geometria
def band(cx, cy, r_out, r_in, t, a0=None, a1=None):
    """Faixa anelar (projeção do anel do botijão) com espessura total da placa,
    dividida em setores de no máx. 45°: com faces anelares inteiras o gravador
    de pressão do FreeCAD deixava de achar parte da malha (carga aplicada ~55%)."""
    if a0 is None:
        a0, a1 = 0.0, 360.0
    n = max(1, int(math.ceil((a1 - a0) / 45.0 - 1e-9)))
    step = (a1 - a0) / n
    secs = [_band_sector(cx, cy, r_out, r_in, t, a0 + i * step, a0 + (i + 1) * step) for i in range(n)]
    return Part.makeCompound(secs)


def _band_sector(cx, cy, r_out, r_in, t, a0, a1):
    s = Part.makeCylinder(r_out, t, V(cx, cy, 0)).cut(Part.makeCylinder(r_in, t, V(cx, cy, 0)))
    if a0 is not None:
        wedge = Part.makeCylinder(r_out + 5, t, V(cx, cy, 0), V(0, 0, 1), a1 - a0)
        wedge.rotate(V(cx, cy, 0), V(0, 0, 1), a0)
        s = s.common(wedge)
    return s


def plate_with_imprints(R, t, load_tool, support_tools, shift=(0.0, 0.0)):
    plate = Part.makeCylinder(R, t, V(shift[0], shift[1], 0))
    tools = list(load_tool.Solids) + support_tools
    res, _ = plate.generalFuse(tools, 0.0)
    sol = [s for s in res.Solids if s.common(plate).Volume > 1e-6]
    return Part.CompSolid(sol) if len(sol) > 1 else sol[0]


def faces_where(shape, pred):
    names = []
    for i, f in enumerate(shape.Faces):
        if pred(f):
            names.append("Face%d" % (i + 1))
    return names


def is_top(f, t):
    return abs(f.BoundBox.ZMin - t) < 1e-6 and abs(f.BoundBox.ZMax - t) < 1e-6


def is_bot(f):
    return abs(f.BoundBox.ZMin) < 1e-6 and abs(f.BoundBox.ZMax) < 1e-6


def inside_tool(f, tool):
    """Face contida na ferramenta. Não usar o centro de massa: o de uma faixa
    anelar cai no centro do anel, fora dela."""
    try:
        return f.common(tool).Area > 0.99 * f.Area
    except Exception:
        return False


# ---------------------------------------------------------------- casos
def cases():
    W = loads()["W_full"]
    r_out = p.bot_ring_D / 2
    r_in = r_out - p.bot_ring_t
    # Excentricidade do botijão mal posicionado (hipótese). Acima de ~35 mm o anel
    # (r=155) passa da borda da placa (R=190) e apoia só na tampa impressa: ver riscos.
    e = 25.0
    out = []
    # ---------- Arquitetura A: 4 apoios pontuais (ressalto do sensor, Ø sens_bump_d)
    sA = []
    for k in range(int(p.n_sens)):
        a = math.radians(p.ang0_sens + k * 360.0 / p.n_sens)
        sA.append((p.r_sens * math.cos(a), p.r_sens * math.sin(a)))
    ea = math.radians(p.ang0_sens)
    for name, desc, tool in (
        ("A_LC1_central", "Botijao centrado, anel completo", band(0, 0, r_out, r_in, p.t_tp_A)),
        ("A_LC2_excentrico", "Botijao deslocado %.0f mm na direcao do sensor 1" % e,
         band(0, 0, r_out, r_in, p.t_tp_A)),
        ("A_LC3_arco90", "Apoio parcial: arco de 90 graus entre dois sensores (anel amassado/inclinado)",
         band(0, 0, r_out, r_in, p.t_tp_A, -45.0, 45.0)),
    ):
        # Excentricidade modelada deslocando placa+apoios (-e) com a faixa de carga
        # concêntrica na origem: o gravador de pressão do FreeCAD perde parte da
        # malha em faixas não concêntricas (só ~55% da carga chegava aos apoios).
        sh = (-e * math.cos(ea), -e * math.sin(ea)) if "LC2" in name else (0.0, 0.0)
        bd = (0.0, 0.0, r_in, r_out, -45.0, 45.0) if "LC3" in name else (0.0, 0.0, r_in, r_out, None, None)
        out.append(dict(name=name, arch="A", desc=desc, t=p.t_tp_A, load=tool, W=W, shift=sh, band=bd,
                        supports=[("disk", x + sh[0], y + sh[1], p.sens_bump_d / 2) for (x, y) in sA]))
    # ---------- Arquitetura B: engaste no espaçador da extremidade de carga
    ml = p.cell_mount_len
    pad = ("box", p.cell_L / 2 - ml, p.cell_L / 2, -p.cell_W / 2, p.cell_W / 2)
    for t in (p.t_tp_B, 3.0):
        tag = "%.0fmm" % t
        full = (0.0, 0.0, r_in, r_out, None, None)
        out.append(dict(name="B_LC1_central_" + tag, arch="B", desc="Botijao centrado, placa %s" % tag, t=t,
                        load=band(0, 0, r_out, r_in, t), W=W, supports=[pad], band=full))
        if t == p.t_tp_B:
            out.append(dict(name="B_LC2_excentrico_" + tag, arch="B",
                            desc="Botijao deslocado %.0f mm para -X (longe do engaste)" % e, t=t,
                            load=band(0, 0, r_out, r_in, t), W=W, shift=(e, 0.0), band=full,
                            supports=[("box", pad[1] + e, pad[2] + e, pad[3], pad[4])]))
            out.append(dict(name="B_LC3_arco90_" + tag, arch="B",
                            desc="Apoio parcial: arco de 90 graus no lado oposto ao engaste", t=t,
                            load=band(0, 0, r_out, r_in, t, 135.0, 225.0), W=W, supports=[pad],
                            band=(0.0, 0.0, r_in, r_out, 135.0, 225.0)))
    return out


def support_solid(s, t):
    if s[0] == "disk":
        return Part.makeCylinder(s[3], t, V(s[1], s[2], 0))
    return Part.makeBox(s[2] - s[1], s[4] - s[3], t, V(s[1], s[3], 0))


# ---------------------------------------------------------------- execução
def run_case(c):
    from femmesh.gmshtools import GmshTools
    from femtools import ccxtools

    doc = App.newDocument("FEM_" + c["name"])
    t = c["t"]
    sup_solids = [support_solid(s, t) for s in c["supports"]]
    shift = c.get("shift", (0.0, 0.0))
    shape = plate_with_imprints(p.R_tp, t, c["load"], sup_solids, shift)
    plate = doc.addObject("Part::Feature", "Placa")
    plate.Shape = shape
    analysis = ObjectsFem.makeAnalysis(doc, "Analise")
    solver = ObjectsFem.makeSolverCalculiXCcxTools(doc, "CalculiX")
    solver.AnalysisType = "static"
    solver.GeometricalNonlinearity = "linear"
    analysis.addObject(solver)
    mat = ObjectsFem.makeMaterialSolid(doc, "Material")
    mat.Material = AL5052
    analysis.addObject(mat)

    load_faces = faces_where(shape, lambda f: is_top(f, t) and inside_tool(f, c["load"]))
    area = sum(shape.Faces[int(n[4:]) - 1].Area for n in load_faces)
    pr = ObjectsFem.makeConstraintPressure(doc, "Carga_Botijao")
    pr.References = [(plate, tuple(load_faces))]
    pr.Pressure = "%.6f MPa" % (c["W"] / area)
    pr.Reversed = False
    analysis.addObject(pr)

    sup_names = []
    for k, sol in enumerate(sup_solids):
        fs = faces_where(shape, lambda f, s=sol: is_bot(f) and inside_tool(f, s))
        if c["arch"] == "A":
            d = ObjectsFem.makeConstraintDisplacement(doc, "Apoio_Sensor_%d" % (k + 1))
            d.zFree, d.zDisplacement = False, "0 mm"
            d.xFree = not (k == 0)
            d.yFree = not (k in (0, 2))
            if not d.xFree:
                d.xDisplacement = "0 mm"
            if not d.yFree:
                d.yDisplacement = "0 mm"
        else:
            d = ObjectsFem.makeConstraintFixed(doc, "Engaste_Celula")
        d.References = [(plate, tuple(fs))]
        analysis.addObject(d)
        sup_names.append(d.Name)

    mesh = ObjectsFem.makeMeshGmsh(doc, "Malha")
    mesh.Shape = plate
    mesh.CharacteristicLengthMax = "%.2f mm" % MESH_MAX
    mesh.CharacteristicLengthMin = "0.8 mm"
    mesh.ElementOrder = "2nd"
    mesh.SecondOrderLinear = True  # arestas retas: evita jacobiano negativo em lascas finas da faixa de carga
    analysis.addObject(mesh)
    doc.recompute()
    err = GmshTools(mesh).create_mesh()
    if err:
        print("GMSH:", err)
    doc.recompute()

    wd = os.path.join(WORK, c["name"])
    os.makedirs(wd, exist_ok=True)
    fea = ccxtools.FemToolsCcx(analysis, solver)
    fea.update_objects()
    fea.setup_working_dir(wd)
    fea.setup_ccx()
    msg = fea.check_prerequisites()
    if msg:
        raise RuntimeError(msg)
    fea.write_inp_file()
    n_load = _replace_load(fea.inp_file_name, mesh.FemMesh.Nodes, t, c["band"], c["W"])
    _add_reaction_print(fea.inp_file_name)
    fea.ccx_run()
    fea.load_results()

    res = [o for o in doc.Objects if o.TypeId == "Fem::FemResultObjectPython"][0]
    fm = mesh.FemMesh
    nodes = fm.Nodes
    uz = {n: d.z for n, d in zip(res.NodeNumbers, res.DisplacementVectors)}
    vm = list(res.vonMises)
    umax_n = min(uz, key=lambda n: uz[n])

    def uz_at(x, y):
        best = min(nodes, key=lambda n: (nodes[n].x - x) ** 2 + (nodes[n].y - y) ** 2 + (nodes[n].z) ** 2)
        return uz[best]

    stops = {}
    r_st, a_st = stops_of(c["arch"])
    for a in a_st:
        x, y = r_st * math.cos(math.radians(a)), r_st * math.sin(math.radians(a))
        stops["%.0f" % a] = uz_at(x + shift[0], y + shift[1])
    reactions = _read_reactions(fea.inp_file_name.replace(".inp", ".dat"))
    tot = sum(reactions.values())
    if abs(tot - c["W"]) > 0.01 * c["W"]:
        raise RuntimeError("Soma das reacoes %.1f N difere da carga %.1f N" % (tot, c["W"]))
    out = dict(name=c["name"], arch=c["arch"], desc=c["desc"], t=t, W=c["W"], area_carga=area, nos_carga=n_load,
               nos=len(nodes), elementos=fm.VolumeCount, uz_min=uz[umax_n],
               uz_min_xy=(nodes[umax_n].x, nodes[umax_n].y), vm_max=max(vm),
               uz_batentes=stops, reacoes=reactions)
    os.makedirs(OUT, exist_ok=True)
    # Salva só a configuração (geometria, material, apoios, carga, parâmetros de malha):
    # malha + resultados dão 30-100 MB por caso. Para ver o campo de tensões no FreeCAD,
    # abra o arquivo, gere a malha (Malha > duplo clique > Aplicar) e rode o CalculiX.
    import Fem
    for o in [o for o in doc.Objects if o.TypeId.startswith(("Fem::FemResult", "Fem::FemPost")) or o.TypeId == "Fem::FemMeshObjectPython" and o.Name != "Malha"]:
        doc.removeObject(o.Name)
    mesh.FemMesh = Fem.FemMesh()
    App.ParamGet("User parameter:BaseApp/Preferences/Document").SetBool("CreateBackupFiles", False)
    doc.saveAs(os.path.join(OUT, "FEM_%s.FCStd" % c["name"]))
    App.closeDocument(doc.Name)
    return out


def _replace_load(inp, nodes, t, bd, W):
    """Troca o *DLOAD do FreeCAD por forças nodais (*CLOAD) iguais nos nós da
    face superior dentro da faixa do anel. Motivo: o gravador de pressão do
    FreeCAD 1.1 perdeu ~45% da carga em faixas anelares divididas (detectado pela
    soma das reações). Forças nodais iguais em tet10 não são a carga consistente
    exata (tensão local na faixa fica aproximada), mas a resultante é exata e é
    conferida depois pela soma das reações."""
    cx, cy, r_in, r_out, a0, a1 = bd
    sel = []
    for n, q in nodes.items():
        if abs(q.z - t) > 1e-6:
            continue
        r = math.hypot(q.x - cx, q.y - cy)
        if r < r_in - 1e-6 or r > r_out + 1e-6:
            continue
        if a0 is not None:
            a = math.degrees(math.atan2(q.y - cy, q.x - cx)) % 360.0
            lo, hi = a0 % 360.0, a1 % 360.0
            inside = (lo <= a <= hi) if lo <= hi else (a >= lo or a <= hi)
            if not inside:
                continue
        sel.append(n)
    if not sel:
        raise RuntimeError("nenhum no na faixa de carga")
    f = W / len(sel)
    lines = open(inp).read().split("\n")
    out, skip = [], False
    for ln in lines:
        if ln.startswith("*DLOAD"):
            skip = True
            continue
        if skip and ln.startswith("*") and not ln.startswith("**"):
            skip = False
        if skip:
            continue
        out.append(ln)
    s = "\n".join(out)
    cload = "** Carga do botijao: %d nos x %.6f N = %.3f N\n*CLOAD\n" % (len(sel), f, W)
    cload += "".join("%d,3,%.8f\n" % (n, -f) for n in sel)
    s = s.replace("*END STEP", cload + "*END STEP", 1)
    open(inp, "w").write(s)
    return len(sel)


def _add_reaction_print(inp):
    s = open(inp).read()
    sets = re.findall(r"\*NSET,\s*NSET=(\w+)", s)
    sets = [x for x in sets if "Apoio" in x or "Engaste" in x or "Fix" in x or "Displacement" in x]
    block = "".join("*NODE PRINT, NSET=%s, TOTALS=ONLY\nRF\n" % x for x in sets)
    s = s.replace("*END STEP", block + "*END STEP", 1)
    open(inp, "w").write(s)


def _read_reactions(dat):
    out = {}
    if not os.path.exists(dat):
        return out
    txt = open(dat).read()
    for m in re.finditer(r"total force \(fx,fy,fz\) for set (\S+) and time\s+\S+\s+([-\d.E+]+)\s+([-\d.E+]+)\s+([-\d.E+]+)", txt):
        out[m.group(1)] = float(m.group(4))
    return out


def report(results):
    lo = loads()
    k = p.k_impact
    L = []
    w = L.append
    w("# Estudo FEM da placa estrutural superior — resultados\n")
    w("> Gerado por `scripts/fem_study.py` (FreeCAD FEM + Gmsh + CalculiX). Não editar à mão.\n")
    w("## Hipóteses (todas precisam de validação)\n")
    w("- Material: %s, E=%s, ν=%s; escoamento típico %.0f MPa (handbook, **não** certificado)." %
      (AL5052["Name"], AL5052["YoungsModulus"], AL5052["PoissonRatio"], SY_AL5052))
    w("- Carga nominal: botijão cheio estimado %.1f kg → **%.0f N** (tara PENDENTE). Análise linear: para o "
      "fator de impacto de apoio k=%.1f (HIPÓTESE), multiplique deslocamentos e tensões por %.1f." % (lo["m_full"], lo["W_full"], k, k))
    w("- Carga aplicada como forças nodais iguais nos nós da face superior dentro da projeção do anel de base (Ø%.0f × %.0f mm, PENDENTE). "
      "A tampa impressa entre o anel e a placa foi ignorada (tende a espalhar a carga: conservador para tensão local)." % (p.bot_ring_D, p.bot_ring_t))
    w("- Arq. A: 4 apoios de Ø%.0f mm (ressalto do sensor) só em Z, rígidos. Arq. B: engaste rígido na área do "
      "espaçador da extremidade de carga (%.0f × %.0f mm). **A flexibilidade do próprio sensor/célula não está no modelo.**" % (p.sens_bump_d, p.cell_mount_len, p.cell_W))
    w("- Malha tetraédrica de 2ª ordem (Gmsh), tamanho máx. %.1f mm. Estudo de convergência de malha: **não feito**." % MESH_MAX)
    w("- Tensões em apoios pontuais/engastes rígidos têm singularidade numérica: o pico local depende da malha e "
      "superestima a tensão real; use a ordem de grandeza, não o número exato.\n")
    w("## Resultados (carga nominal)\n")
    w("| Caso | Descrição | t (mm) | Nós | Flecha máx. (mm) | σ von Mises máx. (MPa) | FS escoamento nominal | FS com impacto ×%.1f |" % k)
    w("|---|---|---|---|---|---|---|---|")
    for r in results:
        fs = SY_AL5052 / r["vm_max"] if r["vm_max"] > 0 else float("inf")
        w("| `%s` | %s | %.0f | %d | %.3f | %.1f | %.1f | %.1f |" % (
            r["name"], r["desc"], r["t"], r["nos"], -r["uz_min"], r["vm_max"], fs, fs / k))
    w("")
    w("## Folga dos batentes de sobrecarga (%.1f mm, PENDENTE)\n" % p.gap_stop)
    w("Deslocamento vertical da placa sobre cada batente (só a flexão da placa; somar a deflexão do sensor/célula "
      "medida em ensaio). Se |uz| se aproximar da folga, o batente encosta em uso normal e **desvia força** (leitura errada).\n")
    for arch in ("A", "B"):
        rs = [r for r in results if r["arch"] == arch]
        if not rs:
            continue
        r_st, _ = stops_of(arch)
        keys = sorted(rs[0]["uz_batentes"], key=float)
        w("**Arquitetura %s** (batentes em r=%.0f mm)\n" % (arch, r_st))
        w("| Caso | " + " | ".join("batente %s°" % a for a in keys) + " | pior × folga | com impacto |")
        w("|---|" + "---|" * (len(keys) + 2))
        for r in rs:
            vals = [r["uz_batentes"][a] for a in keys]
            worst = -min(vals)
            w("| `%s` | %s | %.0f%% | %.0f%% |" % (r["name"], " | ".join("%.3f" % v for v in vals),
                                                     100 * worst / p.gap_stop, 100 * worst * k / p.gap_stop))
        w("")
    w("## Reações nos apoios (soma = carga)\n")
    for r in results:
        if r["reacoes"]:
            tot = sum(r["reacoes"].values())
            w("- `%s`: " % r["name"] + ", ".join("%s = %.1f N (%.0f%%)" % (k2, v, 100 * v / tot) for k2, v in sorted(r["reacoes"].items()))
              + " — soma %.1f N" % tot)
    w("")
    return "\n".join(L)


def main():
    results = []
    only = os.environ.get("MEDEGAS_FEM_ONLY")
    for c in cases():
        if only and only not in c["name"]:
            continue
        print("== FEM", c["name"])
        try:
            results.append(run_case(c))
        except Exception as ex:
            import traceback
            traceback.print_exc()
            print("FALHOU", c["name"], ex)
    os.makedirs(os.path.join(ROOT, "validation"), exist_ok=True)
    jpath = os.path.join(ROOT, "validation", "fem_resultados.json")
    if only and os.path.exists(jpath):  # rodada parcial: mescla com resultados anteriores
        old = {r["name"]: r for r in json.load(open(jpath))}
        old.update({r["name"]: r for r in results})
        order = [c["name"] for c in cases()]
        results = [old[n] for n in order if n in old]
    with open(jpath, "w") as f:
        json.dump(results, f, indent=1)
    if results:
        with open(os.path.join(ROOT, "validation", "fem_resultados.md"), "w", encoding="utf-8") as f:
            f.write(report(results))
        print(report(results))


main()
