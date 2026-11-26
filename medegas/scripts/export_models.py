# -*- coding: utf-8 -*-
"""Exporta STEP (conjuntos e peças), STL (peças impressas) e DXF (chapas).

Uso: freecadcmd scripts/export_models.py   (depois de create_architecture_*.py)

Tudo sai com prefixo PRELIMINAR_: nenhuma peça foi validada com medidas reais
(ver docs/riscos-e-validacoes.md). Peças com dimensões PENDENTES de componente
comercial ficam fora do STL de propósito.
"""
import os
import sys

import FreeCAD as App
import Import
import MeshPart
import Part

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from params import p  # noqa: E402

V = App.Vector
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FC = os.path.join(ROOT, "freecad")
EXP = os.path.join(FC, "exports")
SPLIT = {"Tampa_Superior", "Base_Inferior"}  # Ø400 não cabe na mesa da maioria das impressoras


def sectors(shape, n=4, a0=45.0):
    out = []
    R = 1000
    for i in range(n):
        w = Part.makeCylinder(R, 400, V(0, 0, -100), V(0, 0, 1), 360.0 / n)
        w.rotate(V(0, 0, 0), V(0, 0, 1), a0 + i * 360.0 / n)
        s = shape.common(w)
        if not s.isNull() and s.Volume > 1:
            out.append(s)
    return out


def stl(shape, path):
    m = MeshPart.meshFromShape(Shape=shape, LinearDeflection=0.05, AngularDeflection=0.2, Relative=False)
    m.write(path)


def export_arch(arch):
    tag = "arq_%s" % arch.lower()
    doc = App.openDocument(os.path.join(FC, "MedeGas_Arquitetura_%s.FCStd" % arch))
    parts = [o for o in doc.Objects if o.TypeId == "Part::Feature" and o.Name.startswith("Arquitetura_%s_" % arch)
             and hasattr(o, "NomePeca")]
    for sub in ("step", "stl", "dxf"):
        os.makedirs(os.path.join(EXP, sub, tag), exist_ok=True)
    os.makedirs(os.path.join(FC, "parts", tag), exist_ok=True)
    # conjunto completo (sem botijão) e com botijão de referência
    asm = [o for o in parts if o.NomePeca not in ("Botijao_P13_Referencia", "Cabos")]
    Import.export(asm, os.path.join(EXP, "step", "PRELIMINAR_MedeGas_%s_conjunto.step" % tag))
    Import.export(parts, os.path.join(EXP, "step", "PRELIMINAR_MedeGas_%s_conjunto_com_botijao_REFERENCIA.step" % tag))
    rows = []
    seen = set()
    for o in asm:
        head, _, tail = o.NomePeca.rpartition("_")
        key = head if tail.isdigit() and head else o.NomePeca  # Pe_3 -> Pe; ESP32_C3 fica
        if key in seen:
            continue
        seen.add(key)
        base = "PRELIMINAR_%s_%s" % (tag, key)
        Import.export([o], os.path.join(EXP, "step", tag, base + ".step"))
        fabricated = o.Fabricacao != "Comercial" and not o.Fabricacao.startswith("Comercial")
        # peça individual editável (sem histórico paramétrico: a fonte é o script)
        if fabricated:
            pd = App.newDocument("p_" + key)
            q = pd.addObject("Part::Feature", key)
            q.Shape = o.Shape
            for prop in ("LadoCarga", "Material", "Fabricacao", "StatusValidacao", "Observacao"):
                q.addProperty("App::PropertyString", prop, "MedeGas")
                setattr(q, prop, getattr(o, prop))
            pd.saveAs(os.path.join(FC, "parts", tag, key + ".FCStd"))
            App.closeDocument(pd.Name)
        files = []
        if o.ExportarSTL:
            if key in SPLIT:
                for i, s in enumerate(sectors(o.Shape)):
                    f = base + "_setor%d.stl" % (i + 1)
                    stl(s, os.path.join(EXP, "stl", tag, f))
                    files.append(f)
            else:
                f = base + ".stl"
                stl(o.Shape, os.path.join(EXP, "stl", tag, f))
                files.append(f)
        if key in ("Placa_Superior", "Placa_Inferior"):
            f = base + ".dxf"
            try:
                export_dxf(o.Shape, os.path.join(EXP, "dxf", tag, f))
                files.append(f)
            except Exception as ex:
                print("DXF falhou", key, ex)
        rows.append((key, o.Material, o.Fabricacao, o.StatusValidacao, ", ".join(files) or "-"))
    App.closeDocument(doc.Name)
    return rows


def export_dxf(shape, path):
    """Contorno 2D da chapa (seção a meia espessura) para corte laser/jato d'água."""
    import importDXF
    bb = shape.BoundBox
    zc = (bb.ZMin + bb.ZMax) / 2
    wires = shape.slice(V(0, 0, 1), zc)
    comp = Part.makeCompound(wires)
    comp.translate(V(0, 0, -zc))
    d = App.newDocument("dxf")
    o = d.addObject("Part::Feature", "Contorno")
    o.Shape = comp
    d.recompute()
    importDXF.export([o], path)
    App.closeDocument(d.Name)


def main():
    lines = ["# Manifesto de exportação\n",
             "> Gerado por `scripts/export_models.py`. Todos os arquivos têm prefixo `PRELIMINAR_`: "
             "geometria **não validada**; não fabricar peças estruturais sem revisar `docs/riscos-e-validacoes.md`.\n",
             "- `step/`: conjuntos completos e cada peça (intercâmbio CAD).",
             "- `stl/`: só peças impressas (Exportar STL = sim). Tampa e base saem em 4 setores (Ø%.0f > mesa comum); "
             "os setores ainda **não** têm encaixe/colagem modelados." % p.D_ext,
             "- `dxf/`: contorno das chapas (corte laser/jato d'água) — furos conforme hipóteses atuais.",
             "- `../parts/`: peças fabricadas como FCStd individuais (forma estática; a fonte paramétrica é `scripts/`).\n"]
    for arch in ("A", "B"):
        rows = export_arch(arch)
        lines.append("## Arquitetura %s\n" % arch)
        lines.append("| Peça | Material | Fabricação | Status | Arquivos de manufatura |")
        lines.append("|---|---|---|---|---|")
        for r in rows:
            lines.append("| `%s` | %s | %s | %s | %s |" % r)
        lines.append("")
    with open(os.path.join(EXP, "MANIFESTO.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("\n".join(lines))


main()
