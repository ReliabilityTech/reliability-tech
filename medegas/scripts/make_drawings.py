# -*- coding: utf-8 -*-
"""Gera as folhas TechDraw (dentro dos FCStd das arquiteturas) e os PDF.

Uso: MEDEGAS_BATCH=1 xvfb-run -a freecad scripts/make_drawings.py
Exige GUI (exportação PDF do TechDraw usa o renderizador Qt).
"""
import datetime
import math
import os
import sys
import time
import traceback

import FreeCAD as App
import Part

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from params import p, stack, stops_of  # noqa: E402
from build_assembly import EXPLODE, no_backups, quit_gui  # noqa: E402

V = App.Vector
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FC_DIR = os.path.join(ROOT, "freecad")
PDF_DIR = os.path.join(FC_DIR, "exports", "pdf")
TPL = os.path.join(App.getResourceDir(), "Mod", "TechDraw", "Templates", "ISO", "A3_Landscape_ISO5457_advanced.svg")
LOG = open(os.path.join(ROOT, "freecad", "drawings", "make_drawings.log"), "w") if os.path.isdir(os.path.join(ROOT, "freecad", "drawings")) else sys.stdout
SC = 0.25  # escala 1:4

ARCH_TXT = {"A": "Arq. A - 4 sensores meia ponte", "B": "Arq. B - celula single-point"}


def log(*a):
    LOG.write(" ".join(str(x) for x in a) + "\n")
    LOG.flush()


def wait_gui(n=10):
    if App.GuiUp:
        import FreeCADGui as Gui
        for _ in range(n):
            Gui.updateGui()
            time.sleep(0.05)


# ---------------------------------------------------------------- utilitários TechDraw
def page(doc, name, title, sub, sheet, scale="1:4"):
    pg = doc.addObject("TechDraw::DrawPage", name)
    tp = doc.addObject("TechDraw::DrawSVGTemplate", name + "_Modelo")
    tp.Template = TPL
    pg.Template = tp
    et = tp.EditableTexts
    vals = {
        "legal_owner_1": "Projeto MedeGas", "legal_owner_2": "Prototipo P13 - v0.1",
        "legal_owner_3": "PRELIMINAR - NAO FABRICAR", "legal_owner_4": "cotas PENDENTES: ver docs/",
        "drawing_number": "MG-%s" % name, "revision_index": "0.1", "date_of_issue": datetime.date.today().isoformat(),
        "sheet_number": sheet, "language_code": "pt", "title": title, "supplementary_title_1": sub,
        "supplementary_title_2": "scripts/make_drawings.py", "responsible_department": "Eng. produto",
        "approval_person": "-", "creator": "MedeGas", "document_type": "Desenho de conjunto",
        "document_status": "PRELIMINAR", "scale": scale, "general_tolerances": "ISO 2768-m",
        "part_material": "ver lista de materiais", "copyright": "",
    }
    for k, v in vals.items():
        if k in et:
            et[k] = v
    tp.EditableTexts = et
    return pg


def dview(doc, pg, name, src, direction, xdir, x, y, scale=SC, hidden=False):
    v = doc.addObject("TechDraw::DrawViewPart", name)
    v.Source = src
    v.Direction = direction
    v.XDirection = xdir
    v.ScaleType = "Custom"
    v.Scale = scale
    v.HardHidden = hidden
    pg.addView(v)
    v.X, v.Y = x, y  # depois do addView: addView reposiciona a vista no centro da folha
    return v


def edges(v):
    out = []
    i = 0
    while i < 20000:
        try:
            e = v.getEdgeByIndex(i)
        except Exception:
            break
        if e is None:
            break
        out.append(e)
        i += 1
    return out


def verts(v):
    out = []
    i = 0
    while i < 20000:
        try:
            pt = v.getVertexByIndex(i)
        except Exception:
            break
        if pt is None:
            break
        out.append(pt)
        i += 1
    return out


def dim(doc, pg, v, typ, refs, name, fmt=None, x=None, y=None):
    d = doc.addObject("TechDraw::DrawViewDimension", name)
    d.Type = typ
    d.MeasureType = "Projected"
    d.References2D = [(v, r) for r in refs] if len(refs) > 1 else [(v, refs[0])]
    if fmt:
        d.FormatSpec = fmt
    pg.addView(d)
    d.Arbitrary = False
    if x is not None:
        d.X, d.Y = x, y
    return d


def largest_circle(v, near_r=None):
    best = None
    for i, e in enumerate(edges(v)):
        c = getattr(e, "Curve", None)
        if c is None or c.__class__.__name__ != "Circle":
            continue
        if abs((e.LastParameter - e.FirstParameter) - 2 * math.pi) > 1e-3:
            continue
        r = c.Radius
        score = -abs(r - near_r) if near_r else r
        if best is None or score > best[0]:
            best = (score, i, r)
    return best


def extreme_vertices(v, axis=1):
    vs = verts(v)
    if not vs:
        return None
    def co(q):
        pt = q[1].Point if hasattr(q[1], "Point") else q[1]
        return pt.y if axis == 1 else pt.x
    key = co
    lo = min(enumerate(vs), key=key)
    hi = max(enumerate(vs), key=key)
    return lo[0], hi[0]


BALLOONS = []  # (balão, X, Y): reaplicado após abrir a página na GUI, que reposiciona os balões


def balloon(doc, pg, v, text, origin, pos, name):
    """origin/pos em mm de página, relativos ao centro da vista."""
    b = doc.addObject("TechDraw::DrawViewBalloon", name)
    b.SourceView = v
    b.Text = text
    b.BubbleShape = "Circular"
    if "FILLED_ARROW" in b.getEnumerationsOfProperty("EndType"):
        b.EndType = "FILLED_ARROW"
    pg.addView(b)
    b.OriginX, b.OriginY = origin
    # Origin* está em mm de página; X/Y do balão são multiplicados pela escala da vista
    b.X, b.Y = pos[0] / v.Scale, pos[1] / v.Scale
    BALLOONS.append((b, b.X, b.Y))
    return b


def spread(origins, r_out, min_gap=11.0):
    """Ângulos dos balões num círculo de raio r_out em volta da vista, sem sobreposição."""
    angs = []
    for i, (u, w) in enumerate(origins):
        angs.append(math.atan2(w, u) if math.hypot(u, w) > 1.0 else math.radians(200 + 25 * i))
    order = sorted(range(len(angs)), key=lambda i: angs[i])
    dmin = min_gap / r_out
    for _ in range(200):
        moved = False
        for j in range(len(order)):
            i0, i1 = order[j], order[(j + 1) % len(order)]
            d = (angs[i1] - angs[i0]) % (2 * math.pi) if len(order) > 1 else 10
            if d < dmin:
                push = (dmin - d) / 2 + 1e-3
                angs[i0] -= push
                angs[i1] += push
                moved = True
        if not moved:
            break
    return [(r_out * math.cos(a), r_out * math.sin(a)) for a in angs]


def annotation(doc, pg, name, lines, x, y, size=3.5):
    a = doc.addObject("TechDraw::DrawViewAnnotation", name)
    a.Text = lines
    a.TextSize = size
    pg.addView(a)
    a.X, a.Y = x, y
    return a


def proj(pt, direction, xdir, scale):
    d = direction.normalize()
    xd = xdir.normalize()
    up = d.cross(xd)
    return pt.dot(xd) * scale, pt.dot(up) * scale


# ---------------------------------------------------------------- dados
def arch_objects(doc, arch):
    pref = "Arquitetura_%s_" % arch
    objs = [o for o in doc.Objects if o.Name.startswith(pref) and o.TypeId == "Part::Feature"]
    return [o for o in objs if not o.Name.endswith(("Botijao_P13_Referencia", "Cabos"))]


def item_key(o):
    n = o.NomePeca
    for pfx in ("Pe_", "Batente_", "Sensor_", "Suporte_Sensor_", "Guia_Sensor_"):
        if n.startswith(pfx) and n[len(pfx):].isdigit():
            return pfx[:-1]
    return n


def bom(doc, objs, arch):
    items = {}
    order = []
    for o in objs:
        k = item_key(o)
        if k not in items:
            items[k] = dict(obj=o, qty=0)
            order.append(k)
        items[k]["qty"] += 1
    sh = doc.addObject("Spreadsheet::Sheet", "Lista_de_Pecas")
    hdr = ["Item", "Qtd", "Peca", "Material", "Fabricacao", "Status"]
    for j, h in enumerate(hdr):
        sh.set("%s1" % "ABCDEF"[j], h)
    for i, k in enumerate(order):
        o = items[k]["obj"]
        lab = o.Label
        name = lab.split(" %s" % o.NomePeca.split("_")[-1])[0] if items[k]["qty"] > 1 else lab
        row = [str(i + 1), str(items[k]["qty"]), name[:48], o.Material[:40], o.Fabricacao[:30], o.StatusValidacao]
        for j, val in enumerate(row):
            sh.set("%s%d" % ("ABCDEF"[j], i + 2), "'" + val)
        items[k]["item"] = i + 1
    for col, wdt in zip("ABCDEF", (30, 28, 260, 220, 190, 85)):
        sh.setColumnWidth(col, wdt)
    doc.recompute()
    return sh, items, order


# ---------------------------------------------------------------- folhas
def sheet_assembly(doc, arch, objs, items):
    pg = page(doc, "Folha1_Conjunto", "MedeGas - conjunto", ARCH_TXT[arch], "1/3")
    top = dview(doc, pg, "Vista_Superior", objs, V(0, 0, 1), V(1, 0, 0), 85, 205)
    bot = dview(doc, pg, "Vista_Inferior", objs, V(0, 0, -1), V(1, 0, 0), 205, 205)
    front = dview(doc, pg, "Vista_Frontal", objs, V(0, -1, 0), V(1, 0, 0), 85, 125)
    doc.recompute()
    sec = doc.addObject("TechDraw::DrawViewSection", "Corte_AA")
    sec.BaseView = top
    sec.Source = objs
    sec.ScaleType = "Custom"
    sec.Scale = SC
    sec.SectionNormal = V(1, 0, 0)
    sec.Direction = V(1, 0, 0)
    sec.XDirection = V(0, 1, 0)
    sec.SectionOrigin = V(0, 0, 0)
    sec.SectionSymbol = "A"
    sec.SectionDirection = "Right"
    pg.addView(sec)
    sec.X, sec.Y = 205, 125
    doc.recompute()
    det = doc.addObject("TechDraw::DrawViewDetail", "Detalhe_C")
    det.BaseView = sec
    det.Source = objs
    det.ScaleType = "Custom"
    det.Scale = 1.0
    # borda traseira (y≈+180): batente a 90°, labirinto, linha de sombra, abas
    det.AnchorPoint = V(175.0, 18.0, 0.0)
    det.Radius = 30.0
    det.Reference = "C"
    pg.addView(det)
    det.X, det.Y = 340, 195
    doc.recompute()
    wait_gui()
    # cotas principais
    try:
        c = largest_circle(top)
        if c:
            dim(doc, pg, top, "Diameter", ["Edge%d" % c[1]], "Cota_Diametro", fmt="Ø%.0f")
    except Exception as ex:
        log("cota diametro", ex)
    try:
        ev = extreme_vertices(front, 1)
        if ev:
            dim(doc, pg, front, "DistanceY", ["Vertex%d" % ev[0], "Vertex%d" % ev[1]], "Cota_Altura", fmt="%.1f")
    except Exception as ex:
        log("cota altura", ex)
    z = stack(arch)
    annotation(doc, pg, "Nota_Geral", [
        "NOTAS",
        "1. Desenho PRELIMINAR gerado do modelo parametrico (scripts/params.py).",
        "2. Cotas de componentes comerciais e do botijao P13 sao PENDENTES de medicao.",
        "3. Altura total %.1f mm; folga dos batentes %.1f mm (ajustar na montagem)." % (z["top"], p.gap_stop),
        "4. Lado PESADO (tampa+placa sup.) nao pode tocar o lado SOLO exceto pelo(s) sensor(es).",
        "5. Corte A-A no plano YZ: compartimento eletronico, bateria e USB-C.",
        "6. Detalhe C (1:1): labirinto tampa/base, linha de sombra e folga de sobrecarga.",
    ], 115, 55, 3.0)
    # balões no corte A-A
    try:
        add_balloons(doc, pg, sec, objs, items, V(1, 0, 0), V(0, 1, 0), (205, 125),
                     keys=["Tampa_Superior", "Placa_Superior", "Placa_Inferior", "Base_Inferior", "Compartimento",
                           "Bateria_18650", "Tampa_Servico", "Pe", "Protecao_USB_C", "Celula_SinglePoint"],
                     section_plane=True)
    except Exception:
        log(traceback.format_exc())
    return pg


def add_balloons(doc, pg, v, objs, items, direction, xdir, vpos, keys, section_plane=False, prefix="Balao", r_out=None):
    used = set()
    picks = []
    for o in objs:
        k = item_key(o)
        if k not in keys or k in used or k not in items:
            continue
        sh = o.Shape
        if section_plane:
            cut = sh.common(Part.makeBox(1, 4000, 4000, V(-0.5, -2000, -2000)))  # fatia no plano do corte
            if cut.isNull() or cut.Volume < 1e-3:
                continue
            c = cut.BoundBox.Center
        else:
            c = sh.BoundBox.Center
        picks.append((k, proj(c, direction, xdir, v.Scale)))
        used.add(k)
    r = r_out or (p.D_ext * v.Scale / 2 + 14)
    pos = spread([pk[1] for pk in picks], r)
    for n, ((k, org), ps) in enumerate(zip(picks, pos)):
        if section_plane:  # vista achatada: balões acima/abaixo, espalhados em X
            ps = (org[0] + (n % 2) * 6 - 3, 22 + 9 * (n % 3) if n % 2 == 0 else -18 - 9 * (n % 3))
        balloon(doc, pg, v, str(items[k]["item"]), org, ps, "%s_%d" % (prefix, n))


def sheet_exploded(doc, arch, objs, items, sheet):
    pg = page(doc, "Folha2_Explodida", "MedeGas - explodida e pecas", ARCH_TXT[arch], "2/3", "1:6")
    shapes = []
    for o in objs:
        lk = doc.getObject("Vista_Explodida_" + o.NomePeca)
        if lk is None:
            continue
        s = o.Shape.copy()
        s.Placement = lk.Placement.multiply(s.Placement)
        shapes.append((o, s))
    comp = doc.addObject("Part::Feature", "Explodida_Para_Desenho")
    comp.Label = "Vista explodida (copia estatica p/ desenho)"
    comp.Shape = Part.makeCompound([s for _, s in shapes])
    comp.Visibility = False
    d = V(1, -1, 0.8)
    xd = V(1, 1, 0)
    ex = dview(doc, pg, "Vista_Explodida_Iso", [comp], d, xd, 125, 170, scale=1 / 4.5)
    # lista de peças como texto (a vista de planilha do TechDraw sai ilegível em PDF)
    lines = ["LISTA DE PECAS (detalhes: docs/lista-de-materiais.md)", ""]
    for k in sorted(items, key=lambda kk: items[kk]["item"]):
        o = items[k]["obj"]
        nm = o.Label if items[k]["qty"] == 1 else o.Label.rsplit(" " + o.NomePeca.split("_")[-1], 1)[0]
        lines.append("%2d  %2dx  %-34s %-9s" % (items[k]["item"], items[k]["qty"], nm[:34], o.StatusValidacao))
    annotation(doc, pg, "Tabela_Pecas", lines, 322, 175, 2.6)
    doc.recompute()
    wait_gui()
    picks = []
    used = set()
    for o, s in shapes:
        k = item_key(o)
        if k in used or k == "Cabos":
            continue
        picks.append((k, proj(s.BoundBox.Center, d, xd, ex.Scale)))
        used.add(k)
    pos = spread([pk[1] for pk in picks], 82.0, 10.0)
    for n, ((k, org), ps) in enumerate(zip(picks, pos)):
        balloon(doc, pg, ex, str(items[k]["item"]), org, ps, "BalaoEx_%d" % n)
    return pg


def sheet_fixings(doc, arch, objs, items):
    pg = page(doc, "Folha3_Fixacoes", "MedeGas - fixacoes e carga", ARCH_TXT[arch], "3/3")
    keys_ground = ("Placa_Inferior", "Suporte_Sensor", "Sensor", "Batente", "Espacador_Fixo", "Celula_SinglePoint",
                   "Compartimento", "Pe")
    src = [o for o in objs if item_key(o) in keys_ground]
    tv = dview(doc, pg, "Fixacoes_Superior", src, V(0, 0, 1), V(1, 0, 0), 100, 175, scale=1 / 3.0)
    tp = [o for o in objs if item_key(o) in ("Placa_Superior", "Espacador_Carga")]
    tv2 = dview(doc, pg, "Placa_Superior_Inferior", tp, V(0, 0, -1), V(1, 0, 0), 305, 225, scale=1 / 5.0)
    doc.recompute()
    wait_gui()
    annotation(doc, pg, "Rotulo_Placa_Sup", ["Placa superior vista por baixo (1:5): furos M3 das abas da tampa"], 305, 272, 3.0)
    annotation(doc, pg, "Rotulo_Placa_Inf", ["Lado solo visto de cima (1:3): placa inferior, apoios, batentes, pes"], 100, 272, 3.0)
    try:
        c2 = largest_circle(tv2)
        if c2:
            dim(doc, pg, tv2, "Diameter", ["Edge%d" % c2[1]], "Cota_Placa_Sup", fmt="Ø%.0f")
    except Exception as ex:
        log("cota placa sup", ex)
    lines = ["FIXACOES (placa inferior, Al %.0f mm)" % p.t_bp,
             "%d x M4 - pes, circulo r=%.0f, a %.1f + k*%.0f graus" % (p.n_feet, p.r_feet, p.ang0_feet, 360 / p.n_feet),
             "%d x M6 - batentes de sobrecarga, r=%.0f, angulos %s" % (len(stops_of(arch)[1]), stops_of(arch)[0], ", ".join("%.0f" % a for a in stops_of(arch)[1])),
             "4 x M3 - base impressa, r=120",
             "4 x M3 - abas do compartimento eletronico"]
    if arch == "A":
        lines += ["%d x (2 x M4) - suportes dos sensores, r=%.0f, a %.0f + k*90 graus" % (p.n_sens, p.r_sens, p.ang0_sens),
                  "CAMINHO DA CARGA: anel do botijao -> tampa -> placa sup. (Al %.0f) ->" % p.t_tp_A,
                  "  ressalto de cada sensor -> lingueta -> moldura -> suporte Al -> placa inf. -> pes -> piso"]
    else:
        lines += ["2 x M6 - extremidade fixa da celula (furos a %.0f mm)" % p.cell_hole_pitch,
                  "2 x M6 - extremidade de carga -> placa superior (Al %.0f)" % p.t_tp_B,
                  "CAMINHO DA CARGA: anel -> tampa -> placa sup. -> espacador de carga ->",
                  "  celula (flexao) -> espacador fixo -> placa inf. -> pes -> piso"]
    lines += ["%d x M3 - tampa superior -> placa superior (abas), r=%.0f" % (len(p.tab_angles), p.r_tabs),
              "TODAS AS POSICOES SAO HIPOTESES: ver docs/especificacoes-mecanicas.md"]
    annotation(doc, pg, "Nota_Fixacoes", lines, 305, 130, 2.8)
    try:
        add_balloons(doc, pg, tv, src, items, V(0, 0, 1), V(1, 0, 0), (100, 175),
                     keys=list(keys_ground), prefix="BalaoFx")
    except Exception:
        log(traceback.format_exc())
    return pg


def export_pdf(pg, path):
    import FreeCADGui as Gui
    import TechDrawGui
    pg.ViewObject.doubleClicked()  # sem abrir a página na GUI o PDF sai sem moldura/legenda
    wait_gui(40)
    for b, x, y in BALLOONS:
        try:
            if b.Document is pg.Document:
                b.X, b.Y = x, y
        except ReferenceError:  # balão de documento já fechado (arquitetura anterior)
            pass
    pg.Document.recompute()
    wait_gui(40)
    TechDrawGui.exportPageAsPdf(pg, path)
    log("PDF", path)


def run_arch(arch):
    path = os.path.join(FC_DIR, "MedeGas_Arquitetura_%s.FCStd" % arch)
    del BALLOONS[:]
    doc = App.openDocument(path)
    if any(o.TypeId.startswith("TechDraw::") for o in doc.Objects):
        # remover páginas TechDraw com a GUI aberta derruba o FreeCAD 1.1 (QUnhandledException):
        # o fluxo é sempre regenerar o FCStd (create_architecture_*.py) antes dos desenhos.
        raise RuntimeError("FCStd ja tem folhas TechDraw: rode create_architecture_%s.py antes" % arch.lower())
    objs = arch_objects(doc, arch)
    sheet, items, order = bom(doc, objs, arch)
    pgs = [sheet_assembly(doc, arch, objs, items), sheet_exploded(doc, arch, objs, items, sheet),
           sheet_fixings(doc, arch, objs, items)]
    doc.recompute()
    wait_gui(40)
    no_backups()
    doc.save()
    os.makedirs(PDF_DIR, exist_ok=True)
    for pg in pgs:
        export_pdf(pg, os.path.join(PDF_DIR, "MedeGas_Arq_%s_%s.pdf" % (arch, pg.Name)))
    App.closeDocument(doc.Name)


if __name__ == "__main__" or True:
    try:
        for a in os.environ.get("MEDEGAS_ARCHS", "A,B").split(","):
            run_arch(a)
    except Exception:
        log(traceback.format_exc())
    quit_gui()
