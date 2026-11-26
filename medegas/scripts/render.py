# -*- coding: utf-8 -*-
"""Renderizações PNG (exige FreeCAD com GUI; em servidor use xvfb-run)."""
import math
import os

import FreeCAD as App

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PNG_DIR = os.path.join(ROOT, "freecad", "exports", "png")


def _show_only(doc, names):
    keep = set()
    for n in names:
        o = doc.getObject(n)
        if o is None:
            continue
        keep.add(o.Name)
        for c in o.OutListRecursive:
            keep.add(c.Name)
    for o in doc.Objects:
        if hasattr(o, "Visibility") and o.TypeId != "Spreadsheet::Sheet":
            o.Visibility = o.Name in keep


def _hide(doc, names):
    for n in names:
        o = doc.getObject(n)
        if o is not None:
            o.Visibility = False


def shot(doc, file_name, show, hide=(), view="iso", w=1600, h=1200, zoom=1.0):
    if not App.GuiUp:
        return None
    import FreeCADGui as Gui
    _show_only(doc, show)
    _hide(doc, hide)
    Gui.updateGui()
    gd = Gui.getDocument(doc.Name)
    v = gd.activeView()
    _set_camera(v, doc, ORIENT[view], zoom)
    Gui.updateGui()
    os.makedirs(PNG_DIR, exist_ok=True)
    path = os.path.join(PNG_DIR, file_name)
    v.saveImage(path, w, h, "White")
    print("PNG", path)
    return path


def _effectively_visible(o):
    """Visível e todos os containers-pai (por pertença ao Group) visíveis.
    InList sozinho não serve: os App::Link da vista explodida também apontam para a peça."""
    if not getattr(o, "Visibility", False):
        return False
    for q in o.InList:
        if q.TypeId in ("App::Part", "App::DocumentObjectGroup") and o in q.Group:
            return _effectively_visible(q)
    return True


def _visible_bbox(doc):
    import Part
    bb = App.BoundBox()
    for o in doc.Objects:
        if o.TypeId not in ("Part::Feature", "App::Link") or not _effectively_visible(o):
            continue
        try:
            sh = Part.getShape(o)
            if not sh.isNull():
                bb.add(sh.BoundBox)
        except Exception:
            pass
    return bb


# Orientações (eixo, ângulo em rad) das câmeras padrão do FreeCAD. Fixas em vez de
# viewIsometric()+fitAll(): no modo offscreen a animação de navegação e o fitAll
# deixam a câmera dentro do modelo e o plano de recorte corta metade da peça.
ORIENT = {
    "iso": (0.74290591, 0.30772197, 0.59447294, 1.217116),
    "top": (0.0, 0.0, 1.0, 0.0),
    "bottom": (0.0, 1.0, 0.0, math.pi),
    "front": (1.0, 0.0, 0.0, math.pi / 2),
}


def _set_camera(v, doc, o, zoom=1.0):
    rot = App.Rotation(App.Vector(o[0], o[1], o[2]), math.degrees(o[3]))
    d = rot.multVec(App.Vector(0, 0, 1))
    bb = _visible_bbox(doc)
    c = bb.Center if bb.isValid() else App.Vector()
    diag = bb.DiagonalLength if bb.isValid() else 1000.0
    pos = c + d * (diag * 2 + 100)
    cam = ("#Inventor V2.1 ascii\nOrthographicCamera {\n viewportMapping ADJUST_CAMERA\n"
           " position %f %f %f\n orientation %f %f %f %f\n nearDistance %f\n farDistance %f\n"
           " aspectRatio 1\n focalDistance %f\n height %f\n}\n"
           % (pos.x, pos.y, pos.z, o[0], o[1], o[2], o[3], 1.0, diag * 4 + 200, diag * 2 + 100,
              diag * 0.8 / zoom))
    v.setCamera(cam)


def hide_names(doc, prefix_list):
    out = []
    for o in doc.Objects:
        if any(o.Name.endswith(s) for s in prefix_list):
            out.append(o.Name)
    return out
