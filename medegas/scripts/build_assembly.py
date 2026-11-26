# -*- coding: utf-8 -*-
"""Monta os documentos FreeCAD do MedeGás (chamado pelos create_*.py)."""
import os
import sys

import FreeCAD as App
import Part

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import medegas_lib as L  # noqa: E402
from params import p, stack  # noqa: E402

V = App.Vector
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FC_DIR = os.path.join(ROOT, "freecad")
EXPLODE = 2.0  # multiplicador dos afastamentos 'dz' definidos em medegas_lib


def _section_copy(doc, objs, name, label, plane_ang=0.0):
    """Cópia em corte (meio modelo) para visualizar o interior."""
    grp = doc.addObject("App::Part", name)
    grp.Label = label
    half = L.box(-1000, 0, -1000, 1000, -50, 2000)
    half = L.rotz(half, plane_ang)
    for o, pt in objs:
        try:
            s = o.Shape.common(half)
        except Exception:
            continue
        if s.isNull() or s.Volume < 1e-3:
            continue
        c = doc.addObject("Part::Feature", name + "_" + pt["name"])
        c.Label = "Corte - " + pt["label"]
        c.Shape = s
        grp.addObject(c)
        if App.GuiUp:
            c.ViewObject.ShapeColor = pt["color"]
            c.ViewObject.Transparency = pt["transparency"]
    grp.Visibility = False
    return grp


def _exploded_links(doc, objs, name, label, offset=V(0, 0, 0)):
    grp = doc.addObject("App::Part", name)
    grp.Label = label
    for o, pt in objs:
        lk = doc.addObject("App::Link", name + "_" + pt["name"])
        lk.LinkedObject = o
        lk.Label = "Explodida - " + pt["label"]
        k = EXPLODE
        lk.Placement = App.Placement(V(pt["dxy"][0] * k, pt["dxy"][1] * k, pt["dz"] * k).add(offset), App.Rotation())
        grp.addObject(lk)
    grp.Visibility = False
    return grp


def build_arch(doc, arch, offset=V(0, 0, 0), with_bottle=True, tag=""):
    z, parts = L.build_parts(arch)
    if with_bottle:
        parts.append(L.bottle(z["top"], p.bot_offset))
    name = "Arquitetura_%s%s" % (arch, tag)
    label = {"A": "MedeGas - Arquitetura A (4 sensores de meia ponte)",
             "B": "MedeGas - Arquitetura B (celula single-point)"}[arch]
    top, objs = L.add_parts_to_doc(doc, parts, name, label, offset=offset)
    return z, parts, top, objs


def no_backups():
    App.ParamGet("User parameter:BaseApp/Preferences/Document").SetBool("CreateBackupFiles", False)


def finish_doc(doc, path):
    no_backups()
    doc.recompute()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    doc.saveAs(path)
    print("SALVO", path)


def make_arch_doc(arch):
    docname = "MedeGas_Arquitetura_%s" % arch
    doc = App.newDocument(docname)
    L.add_param_sheet(doc, arch)
    z, parts, top, objs = build_arch(doc, arch)
    _exploded_links(doc, objs, "Vista_Explodida", "Vista explodida (links parametricos)")
    # plane_ang: o meio-espaço mantido é {x·cos(a) + y·sin(a) < 0}
    _section_copy(doc, objs, "Corte_YZ", "Corte A-A: plano YZ (compartimento e USB-C)", plane_ang=0.0)
    if arch == "A":
        _section_copy(doc, objs, "Corte_Sensores", "Corte B-B: plano dos sensores a 45 graus", plane_ang=-45.0)
    else:
        _section_copy(doc, objs, "Corte_Sensores", "Corte B-B: plano XZ (eixo da celula)", plane_ang=-90.0)
    path = os.path.join(FC_DIR, docname + ".FCStd")
    return doc, z, objs, path


def make_master_doc():
    doc = App.newDocument("MedeGas_Mestre")
    L.add_param_sheet(doc, "A")
    zA, _, topA, objsA = build_arch(doc, "A")
    zB, _, topB, objsB = build_arch(doc, "B", offset=V(600, 0, 0))
    _exploded_links(doc, objsA, "Explodida_A", "Vista explodida - Arquitetura A", offset=V(0, 600, 0))
    _exploded_links(doc, objsB, "Explodida_B", "Vista explodida - Arquitetura B", offset=V(600, 600, 0))
    path = os.path.join(FC_DIR, "MedeGas_Mestre.FCStd")
    return doc, (zA, zB), (objsA, objsB), path


def quit_gui():
    """Fecha o FreeCAD só em modo lote (run_all.sh define MEDEGAS_BATCH=1)."""
    if os.environ.get("MEDEGAS_BATCH") != "1":
        return
    sys.stdout.flush()
    os._exit(0)  # sem fechar a janela: evitaria o diálogo "salvar alterações?" no modo lote
