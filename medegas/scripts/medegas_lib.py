# -*- coding: utf-8 -*-
"""Geometria do MedeGás (executar dentro do FreeCAD: freecadcmd / freecad).

Cada peça é descrita por um dicionário com a forma (Part.Shape) e metadados de
engenharia: lado da carga (PESADO = apoiado nos sensores, SOLO = apoiado no
chão, PONTE = o próprio sensor), material, processo, status de validação e
deslocamento na vista explodida. O caminho de carga é a regra central do
projeto: nada do lado PESADO pode tocar o lado SOLO, exceto através do sensor
(e dos batentes de sobrecarga, de propósito, só quando a carga passa do limite).
"""
import math
import os
import sys

import FreeCAD as App
import Part

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from params import PARAMS, p, stack, stops_of, C, H, P  # noqa: E402

V = App.Vector

# ---------------------------------------------------------------- cores
COL = {
    "grafite": (0.17, 0.17, 0.19),
    "aluminio": (0.74, 0.76, 0.79),
    "aco": (0.55, 0.56, 0.58),
    "sensor": (0.62, 0.64, 0.68),
    "borracha": (0.05, 0.05, 0.05),
    "pcb_azul": (0.10, 0.25, 0.60),
    "pcb_verde": (0.05, 0.40, 0.15),
    "pcb_preto": (0.08, 0.08, 0.08),
    "bateria": (0.10, 0.45, 0.70),
    "impresso_cinza": (0.35, 0.35, 0.38),
    "tpu": (0.12, 0.12, 0.12),
    "cabo": (0.85, 0.15, 0.10),
    "botijao": (0.25, 0.45, 0.70),
}


# ---------------------------------------------------------------- primitivas
def cyl(r, h, x=0.0, y=0.0, z=0.0):
    return Part.makeCylinder(r, h, V(x, y, z))


def box(x0, x1, y0, y1, z0, z1):
    return Part.makeBox(x1 - x0, y1 - y0, z1 - z0, V(x0, y0, z0))


def boxc(cx, cy, z0, lx, ly, h):
    return box(cx - lx / 2, cx + lx / 2, cy - ly / 2, cy + ly / 2, z0, z0 + h)


def ring(r_out, r_in, z0, h):
    return cyl(r_out, h, 0, 0, z0).cut(cyl(r_in, h + 2, 0, 0, z0 - 1))


def polar(r, ang_deg):
    a = math.radians(ang_deg)
    return r * math.cos(a), r * math.sin(a)


def rotz(shape, ang_deg, cx=0.0, cy=0.0):
    s = shape.copy()
    s.rotate(V(cx, cy, 0), V(0, 0, 1), ang_deg)
    return s


def fuse_all(shapes):
    s = shapes[0]
    for o in shapes[1:]:
        s = s.fuse(o)
    return s.removeSplitter()


def cut_all(base, tools):
    if not tools:
        return base
    return base.cut(Part.makeCompound(tools) if len(tools) > 1 else tools[0])


def part(name, label, shape, side, material, process, status, color, dz=0.0,
         stl=False, note="", group="Estrutura", transparency=0, dxy=(0.0, 0.0)):
    return dict(name=name, label=label, shape=shape, side=side, material=material,
                process=process, status=status, color=COL.get(color, color), dz=dz,
                stl=stl, note=note, group=group, transparency=transparency, dxy=dxy)


def angles(n, a0):
    return [a0 + i * 360.0 / n for i in range(int(n))]


def foot_angles():
    return angles(p.n_feet, p.ang0_feet)


def sens_angles():
    return angles(p.n_sens, p.ang0_sens)


# ---------------------------------------------------------------- compartimento
def comp_box():
    """Retângulo do compartimento eletrônico (x0,x1,y0,y1)."""
    return (-p.comp_x / 2, p.comp_x / 2, p.comp_y0, p.comp_y1)


# ================================================================ LADO SOLO
def feet(z):
    out = []
    for i, a in enumerate(foot_angles()):
        x, y = polar(p.r_feet, a)
        f = cyl(p.d_foot / 2, p.h_foot, x, y, 0)
        try:
            f = f.makeChamfer(0.8, [e for e in f.Edges if abs(e.BoundBox.ZMin) < 1e-6 and e.Curve.__class__.__name__ == "Circle"])
        except Exception:
            pass
        out.append(part("Pe_%d" % (i + 1), "Pe antiderrapante %d" % (i + 1), f, "SOLO",
                        "Borracha/EPDM com parafuso M4 embutido (comercial)", "Comercial",
                        P, "borracha", dz=-70, group="Pes",
                        note="Dimensoes dependem do pe comprado (d_foot, h_foot)."))
    return out


def bottom_plate(z, arch):
    R = p.R_bp
    s = cyl(R, p.t_bp, 0, 0, z["bp_bot"])
    x0, x1, y0, y1 = comp_box()
    notch = box(x0 - 1, x1 + 1, -R - 5, y1 + 1, z["bp_bot"] - 1, z["bp_top"] + 1)
    holes = [notch]
    for a in foot_angles():  # M4 dos pes
        x, y = polar(p.r_feet, a)
        holes.append(cyl(2.25, p.t_bp + 2, x, y, z["bp_bot"] - 1))
    r_st, a_st = stops_of(arch)
    for a in a_st:  # M6 dos batentes
        x, y = polar(r_st, a)
        holes.append(cyl(3.2, p.t_bp + 2, x, y, z["bp_bot"] - 1))
    for a in (60.0, 120.0, 0.0, 180.0):  # M3 base impressa -> placa
        x, y = polar(120.0, a)
        holes.append(cyl(1.7, p.t_bp + 2, x, y, z["bp_bot"] - 1))
    for sx in (-1, 1):  # M3 abas do compartimento
        for yy in (-160.0, -120.0):
            holes.append(cyl(1.25, p.t_bp + 2, sx * (x1 + 6), yy, z["bp_bot"] - 1))
    if arch == "A":
        for a in sens_angles():
            for d in (-16.0, 16.0):
                lx, ly = polar(p.r_sens, a)
                tx, ty = polar(d, a + 90)
                holes.append(cyl(2.25, p.t_bp + 2, lx + tx, ly + ty, z["bp_bot"] - 1))
    else:
        for xh in cell_holes()[0]:
            holes.append(cyl(3.2, p.t_bp + 2, xh, 0, z["bp_bot"] - 1))
    s = cut_all(s, holes)
    return part("Placa_Inferior", "Placa estrutural inferior", s, "SOLO",
                "Aluminio 5052-H32, %.0f mm" % p.t_bp, "Corte laser/jato d'agua + furacao",
                H, "aluminio", dz=0, group="Estrutura",
                note="Recebe pes, suportes dos sensores/celula e batentes. Lado solo.")


def base_tray(z):
    R = p.D_ext / 2
    t = p.t_shell
    r_lip_out = R - t - p.gap_lab
    r_lip_in = r_lip_out - p.t_lip
    floor = cyl(R, p.t_tray, 0, 0, z["tray_bot"])
    wall = ring(R, r_lip_in, z["tray_bot"], p.z_split - z["tray_bot"])
    lip = ring(r_lip_out, r_lip_in, p.z_split - 0.01, p.h_lip + 0.01)
    s = floor.fuse(wall).fuse(lip)
    # arredonda a aresta inferior externa (pegada visual mais leve)
    try:
        edges = [e for e in s.Edges if e.Curve.__class__.__name__ == "Circle"
                 and abs(e.Curve.Radius - R) < 1e-3 and abs(e.BoundBox.ZMin - z["tray_bot"]) < 1e-3]
        s = s.makeFillet(1.5, edges)
    except Exception:
        pass
    tools = []
    for a in foot_angles():
        x, y = polar(p.r_feet, a)
        tools.append(cyl(p.d_foot / 2 + 2, p.t_tray + 2, x, y, z["tray_bot"] - 1))
    x0, x1, y0, y1 = comp_box()
    tools.append(box(x0 - 0.3, x1 + 0.3, y0 - 0.3, y1 + 0.3, z["tray_bot"] - 1, z["bp_bot"] + 0.5))
    bz0, bz1, bw = usb_bezel_dims(z)
    tools.append(box(-bw / 2 - 0.2, bw / 2 + 0.2, -R - 1, -r_lip_in + 0.5 + 3, bz0 - 0.01, bz1 + 0.2))
    for a in (60.0, 120.0, 0.0, 180.0):
        x, y = polar(120.0, a)
        tools.append(cyl(1.7, p.t_tray + 2, x, y, z["tray_bot"] - 1))
    s = cut_all(s, tools)
    return part("Base_Inferior", "Base inferior (carcaca, lado solo)", s, "SOLO",
                "PETG ou ASA grafite fosco", "Impressao 3D (4 setores colados p/ mesa < 400 mm)",
                H, "grafite", dz=-25, stl=True, group="Carcaca",
                note="Nao estrutural: so fecha e protege. Fixada na placa inferior (4x M3).")


def usb_bezel_dims(z):
    pcb_bot = z["bp_bot"] + 1.0
    usb_cz = pcb_bot + 1.6 + p.usb_H / 2
    bw = 15.0
    bz0 = z["bp_bot"]
    bz1 = usb_cz + 4.0
    return bz0, bz1, bw


def usb_parts(z):
    R = p.D_ext / 2
    bz0, bz1, bw = usb_bezel_dims(z)
    yf = -math.sqrt(R ** 2 - (bw / 2) ** 2)  # face externa (plana)
    y_in = comp_box()[2] - 1.0
    pcb_bot = z["bp_bot"] + 1.0
    usb_cz = pcb_bot + 1.6 + p.usb_H / 2
    flange_d = 1.2
    y_face = yf + flange_d + p.usb_recess  # face do receptaculo
    bez = box(-bw / 2, bw / 2, yf, y_in, bz0, bz1)
    # boca do plugue de proteção + rebaixo da aba
    open_w, open_h = p.usb_W + 1.6, p.usb_H + 1.6
    bez = bez.cut(box(-open_w / 2, open_w / 2, yf - 1, y_face + 0.01, usb_cz - open_h / 2, usb_cz + open_h / 2))
    bez = bez.cut(box(-(open_w + 3) / 2, (open_w + 3) / 2, yf - 1, yf + flange_d, usb_cz - (open_h + 2.6) / 2, usb_cz + (open_h + 2.6) / 2))
    # bolso do breakout
    bez = bez.cut(box(-p.usb_pcb_W / 2 - 0.3, p.usb_pcb_W / 2 + 0.3, y_face - 0.01, y_in + 1, pcb_bot - 0.01, bz1 - 1.2))
    bezel = part("Protecao_USB_C", "Protecao/guia da porta USB-C", bez, "SOLO",
                 "PETG/ASA", "Impressao 3D", H, "impresso_cinza", dz=-25, stl=True, group="USB-C",
                 dxy=(0, -30), note="Encaixa na abertura da base; segura o breakout USB-C.")
    plug = box(-open_w / 2 + 0.15, open_w / 2 - 0.15, yf + flange_d - 0.01, y_face - 0.2, usb_cz - open_h / 2 + 0.15, usb_cz + open_h / 2 - 0.15)
    plug = plug.fuse(box(-(open_w + 3) / 2 + 0.15, (open_w + 3) / 2 - 0.15, yf + 0.05, yf + flange_d, usb_cz - (open_h + 2.6) / 2 + 0.15, usb_cz + (open_h + 2.6) / 2 - 0.15))
    plug = part("Tampa_USB_C", "Tampa de vedacao USB-C (TPU)", plug, "SOLO", "TPU 95A",
                "Impressao 3D (flexivel)", H, "tpu", dz=-25, stl=True, group="USB-C", dxy=(0, -60),
                note="Protecao contra poeira/respingos; nao e vedacao certificada.")
    pcb = box(-p.usb_pcb_W / 2, p.usb_pcb_W / 2, y_face, y_face + p.usb_pcb_L, pcb_bot, pcb_bot + 1.6)
    rec = box(-p.usb_W / 2, p.usb_W / 2, y_face, y_face + 7.35, usb_cz - p.usb_H / 2, usb_cz + p.usb_H / 2)
    brk = part("USB_C_Breakout", "Breakout USB-C (receptaculo)", pcb.fuse(rec), "SOLO",
               "PCB comercial", "Comercial", P, "pcb_preto", dz=-25, group="Eletronica", dxy=(0, -30),
               note="Envelope generico; comprimento do receptaculo 7,35 mm (valor tipico, confirmar).")
    return [bezel, plug, brk]


def service_hatch(z):
    x0, x1, y0, y1 = comp_box()
    s = box(x0, x1, y0, y1, z["tray_bot"], z["bp_bot"])
    for (hx, hy) in comp_boss_xy():
        s = s.cut(cyl(1.7, 5, hx, hy, z["tray_bot"] - 1))
        s = s.cut(cyl(3.0, 1.5, hx, hy, z["tray_bot"] - 0.01))  # cabeça embutida
    return part("Tampa_Servico", "Tampa de servico / bandeja eletronica (removivel por baixo)", s, "SOLO",
                "PETG/ASA", "Impressao 3D", H, "grafite", dz=-55, stl=True, group="Compartimento",
                note="Toda a eletronica e montada nela: sai como uma gaveta, sem abrir o lado pesado.")


def comp_boss_xy():
    x0, x1, y0, y1 = comp_box()
    w = p.comp_wall
    return [(x0 + w + 3, y0 + w + 3), (x1 - w - 3, y0 + w + 3), (x0 + w + 3, y1 - w - 3), (x1 - w - 3, y1 - w - 3)]


def compartment(z):
    x0, x1, y0, y1 = comp_box()
    w = p.comp_wall
    zt = z["comp_top"]
    outer = box(x0, x1, y0, y1, z["bp_bot"], zt)
    inner = box(x0 + w, x1 - w, y0 + w, y1 - w, z["bp_bot"] - 1, zt - 1.5)
    s = outer.cut(inner)
    for (hx, hy) in comp_boss_xy():
        b = cyl(3.2, zt - 1.5 - z["bp_bot"], hx, hy, z["bp_bot"]).cut(cyl(1.25, 30, hx, hy, z["bp_bot"] - 1))
        s = s.fuse(b)
    # abas laterais sobre a placa inferior
    for sx in (-1, 1):
        xa0, xa1 = (x1, x1 + 12) if sx > 0 else (x0 - 12, x0)
        tab = box(xa0, xa1, -170, -110, z["bp_top"], z["bp_top"] + 2.5)
        for yy in (-160.0, -120.0):
            tab = tab.cut(cyl(1.7, 5, sx * (x1 + 6), yy, z["bp_top"] - 1))
        s = s.fuse(tab)
    # passagem de cabos (sensores / USB)
    for sx in (-1, 1):
        s = s.cut(box(sx * (x1 - w) - 2 if sx > 0 else x0 - 1, sx * (x1 - w) + 3 if sx > 0 else x0 + w + 1,
                      -138, -126, z["bp_top"] + 3, z["bp_top"] + 9))
    s = s.cut(box(-5, 5, y0 - 1, y0 + w + 1, z["bp_bot"] - 0.01, z["bp_bot"] + 5))
    s = s.removeSplitter()
    return part("Compartimento", "Compartimento eletronico (tampa de protecao)", s, "SOLO",
                "PETG/ASA (V-0 preferivel)", "Impressao 3D", H, "impresso_cinza", dz=15, stl=True,
                group="Compartimento",
                note="Lado solo. Topo %.1f mm abaixo da placa superior (Arq. A)." % p.clear_top)


def electronics(z):
    out = []
    zf = z["bp_bot"]  # topo da tampa de servico
    x0, x1, y0, y1 = comp_box()
    w = p.comp_wall
    # bateria
    by = y1 - w - 12.0
    bz = zf + 1.2 + p.bat_d / 2
    bat = Part.makeCylinder(p.bat_d / 2, p.bat_L, V(-p.bat_L / 2, by, bz), V(1, 0, 0))
    out.append(part("Bateria_18650", "Bateria 18650 (com protecao)", bat, "SOLO", "Li-ion 18650 protegida",
                    "Comercial", P, "bateria", dz=-30, group="Eletronica",
                    note="Envelope de celula protegida. Usar celula com BMS/protecao."))
    cr = box(-p.bat_L / 2 - 4, p.bat_L / 2 + 4, by - 10, by + 10, zf, bz)
    cr = cr.fuse(box(-p.bat_L / 2 - 4, -p.bat_L / 2 - 0.5, by - 10, by + 10, zf, bz + 3))
    cr = cr.fuse(box(p.bat_L / 2 + 0.5, p.bat_L / 2 + 4, by - 10, by + 10, zf, bz + 3))
    cr = cr.cut(Part.makeCylinder(p.bat_d / 2 + 0.3, p.bat_L + 1, V(-p.bat_L / 2 - 0.5, by, bz), V(1, 0, 0)))
    for xs in (-20.0, 20.0):  # rasgos da cinta
        cr = cr.cut(box(xs - 3, xs + 3, by - 11, by + 11, zf + 1.0, zf + 2.2))
    out.append(part("Suporte_Bateria", "Suporte da bateria (berco + cinta)", cr, "SOLO", "PETG/ASA",
                    "Impressao 3D", H, "impresso_cinza", dz=-42, stl=True, group="Eletronica"))
    # ESP32-C3
    ex0, ey0 = x1 - w - 9 - p.esp_W, y0 + w + 1.5
    sup_h = 3.0
    esp_sup = box(ex0 - 1.5, ex0 + p.esp_W + 1.5, ey0 - 0.5, ey0 + p.esp_L + 1.5, zf, zf + sup_h)
    esp_sup = esp_sup.cut(box(ex0 + 1.5, ex0 + p.esp_W - 1.5, ey0 + 1.5, ey0 + p.esp_L - 1.5, zf - 1, zf + sup_h + 1))
    esp_sup = esp_sup.fuse(box(ex0 - 1.5, ex0, ey0 - 0.5, ey0 + p.esp_L + 1.5, zf + sup_h, zf + sup_h + 2.5))
    esp_sup = esp_sup.fuse(box(ex0 + p.esp_W, ex0 + p.esp_W + 1.5, ey0 - 0.5, ey0 + p.esp_L + 1.5, zf + sup_h, zf + sup_h + 2.5))
    out.append(part("Suporte_ESP32", "Suporte da placa ESP32-C3", esp_sup, "SOLO", "PETG/ASA",
                    "Impressao 3D", H, "impresso_cinza", dz=-42, stl=True, group="Eletronica"))
    esp = box(ex0, ex0 + p.esp_W, ey0, ey0 + p.esp_L, zf + sup_h, zf + sup_h + p.esp_H)
    out.append(part("ESP32_C3", "ESP32-C3 SuperMini (antena voltada p/ parede)", esp, "SOLO", "PCB comercial",
                    "Comercial", P, "pcb_preto", dz=-30, group="Eletronica",
                    note="Antena junto a parede plastica: placas de Al blindam o RF por cima e por baixo."))
    # HX711
    hx0, hy0 = x0 + w + 9, y0 + w + 4
    posts = []
    for (dx, dy) in ((2.5, 2.5), (p.hx_W - 2.5, 2.5), (2.5, p.hx_L - 2.5), (p.hx_W - 2.5, p.hx_L - 2.5)):
        posts.append(cyl(2.2, 3.0, hx0 + dx, hy0 + dy, zf).cut(cyl(0.9, 5, hx0 + dx, hy0 + dy, zf + 0.5)))
    base = box(hx0 - 1, hx0 + p.hx_W + 1, hy0 - 1, hy0 + p.hx_L + 1, zf, zf + 1.0)
    hx_sup = fuse_all([base] + posts)
    out.append(part("Suporte_HX711", "Suporte do HX711 (pinos M2 autoatarrachantes)", hx_sup, "SOLO",
                    "PETG/ASA", "Impressao 3D", H, "impresso_cinza", dz=-42, stl=True, group="Eletronica"))
    hx = box(hx0, hx0 + p.hx_W, hy0, hy0 + p.hx_L, zf + 3.0, zf + 3.0 + p.hx_H)
    out.append(part("HX711", "Modulo HX711", hx, "SOLO", "PCB comercial", "Comercial", P, "pcb_verde",
                    dz=-30, group="Eletronica", note="Blindar/afastar do buck-boost (ruido)."))
    # Carregador + power path (junto ao breakout USB)
    cx0, cy0 = -p.chg_L / 2, y0 + w + 4
    chg = box(cx0, cx0 + p.chg_L, cy0, cy0 + p.chg_W, zf + 1.5, zf + 1.5 + p.chg_H)
    out.append(part("Carregador_PowerPath", "Modulo carregador Li-ion + power path", chg, "SOLO",
                    "PCB comercial", "Comercial", P, "pcb_azul", dz=-30, group="Eletronica",
                    note="Componente ainda nao escolhido; envelope reservado."))
    bb = box(cx0, cx0 + p.bb_L, cy0 + p.chg_W + 4, cy0 + p.chg_W + 4 + p.bb_W, zf + 1.5, zf + 1.5 + p.bb_H)
    out.append(part("BuckBoost_3V3", "Conversor buck-boost 3,3 V", bb, "SOLO", "PCB comercial", "Comercial",
                    P, "pcb_azul", dz=-30, group="Eletronica", note="Componente ainda nao escolhido."))
    pads = [box(cx0 + 2, cx0 + 6, cy0 + 2, cy0 + p.chg_W - 2, zf, zf + 1.5),
            box(cx0 + p.chg_L - 6, cx0 + p.chg_L - 2, cy0 + 2, cy0 + p.chg_W - 2, zf, zf + 1.5),
            box(cx0 + 2, cx0 + 6, cy0 + p.chg_W + 5, cy0 + p.chg_W + 3 + p.bb_W, zf, zf + 1.5),
            box(cx0 + p.bb_L - 6, cx0 + p.bb_L - 2, cy0 + p.chg_W + 5, cy0 + p.chg_W + 3 + p.bb_W, zf, zf + 1.5)]
    out.append(part("Suporte_Energia", "Calcos do carregador e do buck-boost (fita VHB)", fuse_all(pads), "SOLO",
                    "PETG/ASA", "Impressao 3D", H, "impresso_cinza", dz=-42, stl=True, group="Eletronica"))
    return out


def stops(z, arch):
    out = []
    h = z["tp_bot"] - p.gap_stop - z["bp_top"]
    r_st, a_st = stops_of(arch)
    for i, a in enumerate(a_st):
        x, y = polar(r_st, a)
        hexa = Part.makePolygon([V(x + (p.d_stop / math.sqrt(3)) * math.cos(math.radians(k * 60)),
                                   y + (p.d_stop / math.sqrt(3)) * math.sin(math.radians(k * 60)), z["bp_top"])
                                 for k in range(7)])
        s = Part.Face(hexa).extrude(V(0, 0, h - 3.0))
        s = s.fuse(cyl(p.d_stop / 2 - 1.0, 3.0, x, y, z["bp_top"] + h - 3.0))  # ponta (parafuso de ajuste)
        out.append(part("Batente_%d" % (i + 1), "Batente de sobrecarga %d (espacador M6 + parafuso de ajuste)" % (i + 1),
                        s, "SOLO", "Aco zincado", "Comercial", P, "aco", dz=30, group="Fixadores",
                        note="Folga %.1f mm ajustada na montagem com calibrador de laminas." % p.gap_stop))
    return out


# ================================================================ LADO PESADO
def top_plate(z, arch):
    t = p.t_tp_A if arch == "A" else p.t_tp_B
    s = cyl(p.R_tp, t, 0, 0, z["tp_bot"])
    holes = []
    for a in p.tab_angles:
        x, y = polar(p.r_tabs, a)
        holes.append(cyl(1.25, t + 2, x, y, z["tp_bot"] - 1))  # M3 roscado
    if arch == "B":
        for xh in cell_holes()[1]:
            holes.append(cyl(3.2, t + 2, xh, 0, z["tp_bot"] - 1))
    s = cut_all(s, holes)
    mat = "Aluminio 5052-H32, %.0f mm" % t
    return part("Placa_Superior", "Placa estrutural superior", s, "PESADO", mat,
                "Corte laser/jato d'agua + furacao/rosca M3", H, "aluminio", dz=90, group="Estrutura",
                note="Caminho estrutural do botijao ate o(s) sensor(es). Espessura a validar (ver FEM).")


def top_cover(z):
    R = p.D_ext / 2
    t = p.t_shell
    zb = p.z_split + p.gap_shadow
    outer = cyl(R, z["top"] - zb, 0, 0, zb)
    try:
        e = [e for e in outer.Edges if abs(e.BoundBox.ZMin - z["top"]) < 1e-6]
        outer = outer.makeFillet(p.r_round_top, e)
    except Exception:
        pass
    s = outer.cut(cyl(R - t, z["tp_top"] - zb + 1, 0, 0, zb - 1))
    # abas M3 sob a placa superior
    for a in p.tab_angles:
        tab = box(p.r_tabs - 6, R - t + 0.5, -7, 7, z["tp_bot"] - 4, z["tp_bot"])
        tab = tab.cut(cyl(1.7, 6, p.r_tabs, 0, z["tp_bot"] - 5))
        s = s.fuse(rotz(tab, a))
    # baixo-relevo: anel-guia de centragem do botijão + logotipo
    r_g = p.bot_ring_D / 2 + 3
    s = s.cut(ring(r_g + 0.6, r_g - 0.6, z["top"] - 0.3, 1))
    logo = logo_shape(z["top"] - 0.4, 0.41)
    if logo is not None:
        s = s.cut(logo)
    s = s.removeSplitter()
    return part("Tampa_Superior", "Tampa superior (carcaca, lado pesado)", s, "PESADO",
                "PETG ou ASA grafite, face superior texturizada (mesa PEI texturizada)",
                "Impressao 3D invertida (4 setores colados p/ mesa < 400 mm)", H, "grafite", dz=140, stl=True,
                group="Carcaca",
                note="Nao estrutural: apoiada integralmente na placa superior. Logotipo e anel-guia em baixo-relevo.")


_FONTS = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
          "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
          "C:/Windows/Fonts/arialbd.ttf", "/Library/Fonts/Arial Bold.ttf"]


def logo_shape(z0, depth):
    font = next((f for f in _FONTS if os.path.exists(f)), None)
    if font is None:
        return None
    try:
        wires = Part.makeWireString("MedeGás", font, 11.0, 0.0)
        faces = []
        for ch in wires:
            if not ch:
                continue
            f = Part.makeFace(ch, "Part::FaceMakerBullseye")
            faces.append(f)
        comp = Part.makeCompound(faces)
        bb = comp.BoundBox
        comp.translate(V(-bb.Center.x, -(p.D_ext / 2 - 22) - bb.Center.y, z0))
        return comp.extrude(V(0, 0, depth + 0.5))
    except Exception as ex:  # fonte ausente/incompatível: segue sem logotipo
        App.Console.PrintWarning("Logotipo nao gerado: %s\n" % ex)
        return None


# ================================================================ ARQ. A
def sensor_shape(z):
    L, W, Hs = p.sens_L, p.sens_W, p.sens_H
    body = boxc(0, 0, z["sup_top"], L, W, Hs)
    # rasgos em "E" sugerindo a lingueta central (geometria real a medir)
    for sy in (-1, 1):
        body = body.cut(boxc(-2, sy * 6, z["sup_top"] - 1, L - 12, 1.6, Hs + 2))
    body = body.cut(boxc(L / 2 - 9, 0, z["sup_top"] - 1, 1.6, 13.6, Hs + 2))
    bump = cyl(p.sens_bump_d / 2, p.sens_bump_h, 0, 0, z["sens_top"])
    s = body.fuse(bump)
    for i, dy in enumerate((-2.5, 0.0, 2.5)):  # 3 fios saindo p/ o centro
        s = s.fuse(Part.makeCylinder(0.7, 6, V(-L / 2, dy, z["sup_top"] + Hs / 2), V(-1, 0, 0)))
    return s


def sensor_support_shape(z):
    s = boxc(0, 0, z["bp_top"], p.sup_L, p.sup_L, p.sup_H)
    s = s.cut(boxc(0, 0, z["sup_top"] - p.sup_pocket_h, p.sup_pocket, p.sup_pocket, p.sup_pocket_h + 1))
    for d in (-16.0, 16.0):
        s = s.cut(cyl(2.25, p.sup_H + 2, 0, d, z["bp_top"] - 1))
        s = s.cut(cyl(3.8, 4.5, 0, d, z["sup_top"] - 4.5))  # cabeça M4 embutida
    s = s.cut(boxc(-p.sup_L / 2, 0, z["sup_top"] - 3, 10, 9, 4))  # saída dos fios
    return s


def sensor_guide_shape(z):
    o = boxc(0, 0, z["sup_top"], p.sens_L + 5, p.sens_W + 5, 4.0)
    i = boxc(0, 0, z["sup_top"] - 1, p.sens_L + 0.4, p.sens_W + 0.4, 6.0)
    g = o.cut(i).cut(boxc(-p.sens_L / 2, 0, z["sup_top"] - 1, 8, 8, 6))
    return g


def arch_A_sensors(z):
    out = []
    for i, a in enumerate(sens_angles()):
        x, y = polar(p.r_sens, a)

        def place(sh):
            s = rotz(sh, a)
            s.translate(V(x, y, 0))
            return s
        out.append(part("Sensor_%d" % (i + 1), "Sensor de meia ponte %d (%.0f kg nominal - PENDENTE)" % (i + 1, p.sens_cap),
                        place(sensor_shape(z)), "PONTE", "Aco liga c/ extensometros (comercial)", "Comercial (kit 4x)",
                        P, "sensor", dz=55, group="Medicao",
                        note="Orientacao e ligacao conforme o kit (vermelho/preto/branco). Medir antes de fabricar suportes."))
        out.append(part("Suporte_Sensor_%d" % (i + 1), "Suporte do sensor %d (bloco Al com alivio)" % (i + 1),
                        place(sensor_support_shape(z)), "SOLO", "Aluminio 6061, barra 50x%.0f" % p.sup_H,
                        "Serra + fresa/furadeira de bancada", H, "aluminio", dz=30, group="Medicao",
                        note="Apoia a moldura externa do sensor; rebaixo deixa a lingueta fletir livre."))
        out.append(part("Guia_Sensor_%d" % (i + 1), "Guia de posicionamento do sensor %d" % (i + 1),
                        place(sensor_guide_shape(z)), "SOLO", "PETG", "Impressao 3D", H, "impresso_cinza",
                        dz=42, stl=True, group="Medicao", note="So posiciona; nao transmite carga."))
    return out


# ================================================================ ARQ. B
def cell_holes():
    L = p.cell_L
    a = L / 2 - 7.5
    fixed = [-a, -a + p.cell_hole_pitch]
    load = [a, a - p.cell_hole_pitch]
    return fixed, load


def cell_shape(z):
    L, W, Hc = p.cell_L, p.cell_W, p.cell_H
    s = boxc(0, 0, z["cell_bot"], L, W, Hc)
    zc = z["cell_bot"] + Hc / 2
    r = min(7.0, Hc / 2 - 3.5)
    for xx in (-12.0, 12.0):
        s = s.cut(Part.makeCylinder(r, W + 2, V(xx, -W / 2 - 1, zc), V(0, 1, 0)))
    s = s.cut(box(-12, 12, -W / 2 - 1, W / 2 + 1, zc - r * 0.35, zc + r * 0.35))
    for xh in cell_holes()[0] + cell_holes()[1]:
        s = s.cut(cyl(3.0, Hc + 2, xh, 0, z["cell_bot"] - 1))
    s = s.fuse(Part.makeCylinder(2.5, 12, V(-L / 2, 0, zc), V(-1, 0, 0)))  # saída do cabo
    return s


def arch_B_cell(z):
    out = []
    out.append(part("Celula_SinglePoint", "Celula de carga single-point (%.0f kg - PENDENTE)" % p.cell_cap,
                    cell_shape(z), "PONTE", "Aluminio (comercial)", "Comercial", P, "sensor", dz=50, group="Medicao",
                    note="Envelope generico. Exigir no datasheet: capacidade, tamanho max. de plataforma, erro de canto."))
    ml = p.cell_mount_len
    fx = box(-p.cell_L / 2, -p.cell_L / 2 + ml, -p.cell_W / 2, p.cell_W / 2, z["bp_top"], z["cell_bot"])
    lx = box(p.cell_L / 2 - ml, p.cell_L / 2, -p.cell_W / 2, p.cell_W / 2, z["cell_top"], z["adapt_top"])
    for xh in cell_holes()[0]:
        fx = fx.cut(cyl(3.2, 20, xh, 0, z["bp_top"] - 1))
    for xh in cell_holes()[1]:
        lx = lx.cut(cyl(3.2, 20, xh, 0, z["cell_top"] - 1))
    out.append(part("Espacador_Fixo", "Espacador da extremidade fixa (Al)", fx, "SOLO", "Aluminio 6061",
                    "Serra + furadeira", H, "aluminio", dz=25, group="Medicao",
                    note="Garante a folga sob a extremidade de carga (nao pode encostar na placa)."))
    out.append(part("Espacador_Carga", "Espacador da extremidade de carga (Al)", lx, "PESADO", "Aluminio 6061",
                    "Serra + furadeira", H, "aluminio", dz=75, group="Medicao",
                    note="Garante a folga entre placa superior e extremidade fixa."))
    return out


# ================================================================ CABOS (ilustrativos)
def cable(points, r=1.5):
    segs = []
    for a, b in zip(points[:-1], points[1:]):
        d = b.sub(a)
        if d.Length < 1e-6:
            continue
        segs.append(Part.makeCylinder(r, d.Length, a, d))
    for pt in points[1:-1]:
        segs.append(Part.makeSphere(r, pt))
    return Part.makeCompound(segs)


def cables(z, arch):
    x0, x1, y0, y1 = comp_box()
    zc = z["bp_top"] + 6
    cs = []
    if arch == "A":
        for a in sens_angles():
            ex, ey = polar(p.r_sens - p.sens_L / 2 - 6, a)
            mx, my = polar(p.r_sens - p.sens_L / 2 - 14, a)
            side = -1 if math.cos(math.radians(a)) < 0 else 1
            pts = [V(ex, ey, z["sup_top"] + p.sens_H / 2), V(mx, my, zc), V(side * (x1 + 10), -132, zc),
                   V(side * (x1 - 4), -132, zc)]
            cs.append(cable(pts, 1.2))
    else:
        pts = [V(-p.cell_L / 2 - 12, 0, z["cell_bot"] + p.cell_H / 2), V(-p.cell_L / 2 - 25, 0, zc),
               V(x0 - 10, -132, zc), V(x0 + 4, -132, zc)]
        cs.append(cable(pts, 2.0))
    return [part("Cabos", "Cabos dos sensores (ilustrativo, roteamento)", Part.makeCompound(cs), "SOLO",
                 "Cabo blindado 4 vias", "Comercial", H, "cabo", dz=10, group="Eletronica",
                 note="Fixar com abracadeiras adesivas na placa inferior; nunca no lado pesado.")]


# ================================================================ BOTIJÃO
def bottle(z_base, x_off=0.0):
    R = p.bot_D / 2
    b = 90.0  # semi-eixo do tampo elipsoidal 2:1 (hipótese)
    r_ring = p.bot_ring_D / 2
    h_ring = p.bot_ring_h
    hh = b * (1 - math.sqrt(1 - (r_ring / R) ** 2))
    z_apex = h_ring - hh
    z_cyl0 = z_apex + b
    collar_h = 75.0
    z_top_apex = p.bot_H - collar_h + 20.0
    L_cyl = z_top_apex - b - z_cyl0
    sph = Part.makeSphere(1.0)
    m = App.Matrix()
    m.scale(R, R, b)
    ell = sph.transformGeometry(m)
    low = ell.copy()
    low.translate(V(0, 0, z_cyl0))
    low = low.common(box(-R - 1, R + 1, -R - 1, R + 1, z_cyl0 - b - 1, z_cyl0))
    up = ell.copy()
    up.translate(V(0, 0, z_cyl0 + L_cyl))
    up = up.common(box(-R - 1, R + 1, -R - 1, R + 1, z_cyl0 + L_cyl, z_cyl0 + L_cyl + b + 1))
    body = cyl(R, L_cyl, 0, 0, z_cyl0).fuse(low).fuse(up)
    ringS = ring(r_ring, r_ring - p.bot_ring_t, 0, h_ring)
    rc = p.bot_collar_D / 2
    collar = ring(rc, rc - 3, p.bot_H - collar_h, collar_h)
    for a in (0.0, 180.0):
        win = box(rc - 10, rc + 10, -45, 45, p.bot_H - 40, p.bot_H - 14)  # aberturas da alça
        collar = collar.cut(rotz(win, a))
    valve = cyl(16, 45, 0, 0, z_top_apex - 5)
    s = body.fuse(ringS).fuse(collar).fuse(valve)
    s.translate(V(x_off, 0, z_base))
    return part("Botijao_P13_Referencia", "Botijao P13 - geometria de REFERENCIA (nao medido)", s, "REFERENCIA",
                "Aco (NBR 8460) - referencia", "-", P, "botijao", dz=260, group="Referencia", transparency=55,
                note="Todas as cotas PENDENTES de medicao em botijao real. Apoio pelo anel de base (saia).")


# ================================================================ MONTAGENS
def build_parts(arch):
    z = stack(arch)
    parts = []
    parts += feet(z)
    parts.append(base_tray(z))
    parts.append(service_hatch(z))
    parts.append(bottom_plate(z, arch))
    parts.append(compartment(z))
    parts += electronics(z)
    parts += usb_parts(z)
    parts += stops(z, arch)
    if arch == "A":
        parts += arch_A_sensors(z)
    else:
        parts += arch_B_cell(z)
    parts.append(top_plate(z, arch))
    parts.append(top_cover(z))
    parts += cables(z, arch)
    return z, parts


GROUP_ORDER = ["Carcaca", "Estrutura", "Medicao", "Pes", "Fixadores", "Compartimento", "Eletronica", "USB-C", "Referencia"]


def add_parts_to_doc(doc, parts, container_name, container_label, offset=V(0, 0, 0), exploded=False):
    top = doc.addObject("App::Part", container_name)
    top.Label = container_label
    groups = {}
    objs = []
    for g in GROUP_ORDER:
        if any(pt["group"] == g for pt in parts):
            gp = doc.addObject("App::DocumentObjectGroup", container_name + "_" + g.replace("-", ""))
            gp.Label = g
            top.addObject(gp)
            groups[g] = gp
    for pt in parts:
        o = doc.addObject("Part::Feature", container_name + "_" + pt["name"])
        o.Label = pt["label"]
        sh = pt["shape"].copy()
        if exploded:
            sh.translate(V(pt["dxy"][0], pt["dxy"][1], pt["dz"]))
        sh.translate(offset)
        o.Shape = sh
        for prop, val in (("LadoCarga", pt["side"]), ("Material", pt["material"]),
                          ("Fabricacao", pt["process"]), ("StatusValidacao", pt["status"]),
                          ("Observacao", pt["note"]), ("NomePeca", pt["name"])):
            o.addProperty("App::PropertyString", prop, "MedeGas")
            setattr(o, prop, val)
        o.addProperty("App::PropertyBool", "ExportarSTL", "MedeGas")
        o.ExportarSTL = bool(pt["stl"])
        o.addProperty("App::PropertyFloat", "MassaEstimada_g", "MedeGas")
        groups[pt["group"]].addObject(o)
        if App.GuiUp:
            vo = o.ViewObject
            vo.ShapeColor = pt["color"]
            vo.Transparency = pt["transparency"]
            if pt["side"] == "REFERENCIA":
                vo.DisplayMode = "Shaded"
        objs.append((o, pt))
    return top, objs


def add_param_sheet(doc, arch):
    sh = doc.addObject("Spreadsheet::Sheet", "Parametros")
    sh.Label = "Parametros (fonte: scripts/params.py)"
    sh.set("A1", "Parametro")
    sh.set("B1", "Valor")
    sh.set("C1", "Status")
    sh.set("D1", "Descricao")
    row = 2
    for k, (val, st, desc) in PARAMS.items():
        sh.set("A%d" % row, k)
        sh.set("B%d" % row, "'" + str(val) if isinstance(val, tuple) else str(val))
        sh.set("C%d" % row, st)
        sh.set("D%d" % row, desc)
        if not isinstance(val, tuple):
            try:
                sh.setAlias("B%d" % row, k)
            except Exception:
                pass
        row += 1
    row += 1
    z = stack(arch)
    sh.set("A%d" % row, "Cadeia de alturas (Arq. %s)" % arch)
    row += 1
    for k, val in z.items():
        sh.set("A%d" % row, "z_" + k)
        sh.set("B%d" % row, "%.2f" % val)
        row += 1
    return sh


def set_colors(objs):
    if not App.GuiUp:
        return
    for o, pt in objs:
        o.ViewObject.ShapeColor = pt["color"]
        o.ViewObject.Transparency = pt["transparency"]
