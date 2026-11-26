# -*- coding: utf-8 -*-
"""Parâmetros do MedeGás — fonte única de verdade da geometria.

Cada parâmetro tem (valor, status, descrição). Status:
  CONFIRMADO  - decisão tomada ou valor normativo/definição
  HIPOTESE    - escolha de projeto provisória, pode mudar sem medir nada
  PENDENTE    - depende de medida real ou datasheet do componente comprado

Para alterar: edite aqui e rode scripts/run_all.sh, ou sobrescreva na linha de
comando (ex.: MEDEGAS_SET="D_ext=380,r_sens=145" ./scripts/run_all.sh).
Todas as cotas em mm, massas em kg, forças em N.
"""
import os

C, H, P = "CONFIRMADO", "HIPOTESE", "PENDENTE"

PARAMS = {
    # ---------------- Envelope externo ----------------
    "D_ext": (400.0, H, "Diametro externo da plataforma"),
    "t_shell": (2.5, H, "Espessura de parede da tampa e da base impressas"),
    "r_round_top": (4.0, H, "Raio de arredondamento da borda superior da tampa"),
    "z_split": (14.0, H, "Altura do topo da parede visivel da base (linha de sombra)"),
    "gap_shadow": (2.0, H, "Folga vertical tampa/base (linha de sombra, sem contato)"),
    "gap_lab": (1.5, H, "Folga radial do labirinto entre saia da tampa e labio da base"),
    "h_lip": (7.0, H, "Altura do labio interno da base acima de z_split"),
    "t_lip": (1.6, H, "Espessura do labio interno da base"),
    # ---------------- Pes e base ----------------
    "n_feet": (8, H, "Quantidade de pes antiderrapantes (lado solo)"),
    "r_feet": (180.0, H, "Raio do circulo dos pes"),
    "ang0_feet": (22.5, H, "Angulo do primeiro pe (graus)"),
    "d_foot": (20.0, P, "Diametro do pe de borracha (depende do pe comprado)"),
    "h_foot": (5.0, P, "Altura do pe de borracha (depende do pe comprado)"),
    "t_tray": (2.0, H, "Espessura do fundo da base impressa"),
    # ---------------- Placas metalicas ----------------
    "t_bp": (3.0, H, "Espessura da placa inferior (Al 5052-H32)"),
    "R_bp": (192.0, H, "Raio da placa inferior"),
    "R_tp": (190.0, H, "Raio da placa superior"),
    "t_tp_A": (3.0, H, "Espessura da placa superior, Arquitetura A (Al 5052-H32)"),
    "t_tp_B": (6.0, H, "Espessura da placa superior, Arquitetura B (Al 5052/6061) - ver FEM"),
    "tab_angles": ((20.0, 80.0, 140.0, 200.0, 235.0, 320.0), H, "Angulos das abas de fixacao tampa->placa superior (M3 por baixo)"),
    "r_tabs": (184.0, H, "Raio das abas/furos M3 da tampa"),
    # ---------------- Batentes de sobrecarga ----------------
    "stop_angles_A": ((45.0, 135.0, 225.0, 315.0), H, "Arq. A: batentes no eixo de cada sensor, por fora (placa quase nao flete ali - ver FEM)"),
    "r_stop_A": (181.0, H, "Arq. A: raio dos batentes"),
    "stop_angles_B": ((0.0, 90.0, 180.0, 240.0, 300.0), H, "Arq. B: angulos dos batentes (270 livre p/ compartimento)"),
    "r_stop_B": (172.0, H, "Arq. B: raio dos batentes"),
    "gap_stop": (0.8, P, "Folga batente->placa superior (ajustar pela deflexao real do sensor)"),
    "d_stop": (10.0, H, "Diametro do batente (espacador sextavado M6, 10 mm entre faces)"),
    # ---------------- Arquitetura A: 4 sensores de meia ponte ----------------
    "n_sens": (4, C, "Quantidade de sensores de meia ponte"),
    "r_sens": (150.0, H, "Raio dos sensores (alinhado ao anel de apoio do botijao)"),
    "ang0_sens": (45.0, H, "Angulo do primeiro sensor"),
    "sens_L": (34.0, P, "Sensor meia ponte - comprimento (medir o do kit)"),
    "sens_W": (34.0, P, "Sensor meia ponte - largura (medir o do kit)"),
    "sens_H": (8.0, P, "Sensor meia ponte - altura do corpo (medir o do kit)"),
    "sens_bump_d": (6.0, P, "Sensor meia ponte - diametro do ressalto central"),
    "sens_bump_h": (1.0, P, "Sensor meia ponte - altura do ressalto central"),
    "sens_cap": (50.0, P, "Capacidade nominal por sensor (kg) - ler etiqueta/datasheet"),
    "sup_L": (46.0, H, "Suporte do sensor (bloco Al) - lado"),
    "sup_H": (14.0, H, "Suporte do sensor (bloco Al) - altura"),
    "sup_pocket": (24.0, P, "Rebaixo de alivio sob a lingueta do sensor - lado"),
    "sup_pocket_h": (2.0, P, "Rebaixo de alivio - profundidade (>= deflexao maxima)"),
    # ---------------- Arquitetura B: celula single-point ----------------
    "cell_L": (130.0, P, "Celula single-point - comprimento (envelope generico)"),
    "cell_W": (30.0, P, "Celula single-point - largura (envelope generico)"),
    "cell_H": (22.0, P, "Celula single-point - altura (envelope generico)"),
    "cell_hole_pitch": (25.0, P, "Celula - distancia entre furos de fixacao em cada extremidade"),
    "cell_mount_len": (40.0, P, "Celula - comprimento de cada extremidade de fixacao"),
    "cell_cap": (50.0, P, "Capacidade nominal da celula (kg) - ver analise de carga"),
    "cell_plat_max": (400.0, P, "Tamanho maximo de plataforma admitido pela celula (datasheet)"),
    "spacer_B": (4.0, H, "Espacadores metalicos sob/sobre a celula"),
    # ---------------- Compartimento eletronico (lado solo) ----------------
    "comp_x": (100.0, H, "Compartimento - largura externa (X)"),
    "comp_y0": (-182.0, H, "Compartimento - face externa voltada p/ parede (Y)"),
    "comp_y1": (-94.0, H, "Compartimento - face interna (Y)"),
    "comp_wall": (2.0, H, "Compartimento - espessura de parede"),
    "clear_top": (2.5, H, "Folga minima compartimento -> placa superior"),
    # ---------------- Eletronica (envelopes) ----------------
    "esp_L": (22.5, P, "ESP32-C3 SuperMini - comprimento (medir a placa comprada)"),
    "esp_W": (18.0, P, "ESP32-C3 SuperMini - largura"),
    "esp_H": (4.5, P, "ESP32-C3 SuperMini - altura com componentes"),
    "hx_L": (33.0, P, "Modulo HX711 - comprimento"),
    "hx_W": (21.0, P, "Modulo HX711 - largura"),
    "hx_H": (4.0, P, "Modulo HX711 - altura"),
    "chg_L": (30.0, P, "Modulo carregador + power path - comprimento"),
    "chg_W": (25.0, P, "Modulo carregador + power path - largura"),
    "chg_H": (6.0, P, "Modulo carregador + power path - altura"),
    "bb_L": (20.0, P, "Conversor buck-boost 3,3 V - comprimento"),
    "bb_W": (15.0, P, "Conversor buck-boost 3,3 V - largura"),
    "bb_H": (5.0, P, "Conversor buck-boost 3,3 V - altura"),
    "bat_d": (18.6, P, "Celula 18650 - diametro (18 nominal; protegida ate ~18,6)"),
    "bat_L": (70.0, P, "Celula 18650 - comprimento (65 nominal; protegida ate ~70)"),
    "usb_W": (8.94, C, "Receptaculo USB-C - largura da boca (especificacao USB-IF)"),
    "usb_H": (3.26, C, "Receptaculo USB-C - altura da boca (especificacao USB-IF)"),
    "usb_pcb_L": (14.0, P, "Breakout USB-C - comprimento"),
    "usb_pcb_W": (12.0, P, "Breakout USB-C - largura"),
    "usb_recess": (1.0, H, "Recuo da face do receptaculo em relacao a superficie externa"),
    # ---------------- Botijao P13 (referencia) ----------------
    "glp_mass": (13.0, C, "Massa nominal de GLP do P13 (definicao do produto)"),
    "tara_mass": (15.0, P, "Tara do botijao (gravada na alca; varia por botijao)"),
    "bot_D": (360.0, P, "Diametro do corpo do botijao"),
    "bot_H": (470.0, P, "Altura total do botijao"),
    "bot_ring_D": (310.0, P, "Diametro externo do anel de base (saia)"),
    "bot_ring_t": (3.0, P, "Espessura da chapa do anel de base"),
    "bot_ring_h": (60.0, P, "Altura do anel de base"),
    "bot_collar_D": (220.0, P, "Diametro do colarinho/alca superior"),
    "bot_cg_h": (230.0, P, "Altura do CG do botijao cheio acima do apoio"),
    "bot_offset": (0.0, H, "Excentricidade do botijao sobre a plataforma (caso de estudo)"),
    # ---------------- Cargas de projeto ----------------
    "g": (9.81, C, "Aceleracao da gravidade"),
    "k_impact": (2.0, H, "Fator dinamico ao apoiar o botijao (impacto) - validar em ensaio"),
    "F_abuse": (1000.0, H, "Carga de abuso (pessoa ~100 kg) - deve encostar nos batentes"),
}


def _apply_overrides():
    raw = os.environ.get("MEDEGAS_SET", "").strip()
    if not raw:
        return
    for item in raw.split(","):
        k, v = item.split("=")
        k = k.strip()
        if k not in PARAMS:
            raise KeyError("Parametro desconhecido: %s" % k)
        old, st, desc = PARAMS[k]
        PARAMS[k] = (type(old)(float(v)) if not isinstance(old, tuple) else old, st, desc)


_apply_overrides()


def v(name):
    return PARAMS[name][0]


class _V:
    def __getattr__(self, n):
        return v(n)


p = _V()


# ---------------- Grandezas derivadas (cadeia de alturas) ----------------
def stack(arch):
    """Cotas Z de cada camada (mm). Lado solo: pes, base, placa inferior.
    Lado pesado: placa superior e tampa. Sensores fazem a ponte."""
    z = {}
    z["floor"] = 0.0
    z["foot_top"] = p.h_foot
    z["tray_bot"] = p.h_foot - p.t_tray
    z["bp_bot"] = p.h_foot
    z["bp_top"] = p.h_foot + p.t_bp
    if arch == "A":
        z["sup_top"] = z["bp_top"] + p.sup_H
        z["sens_top"] = z["sup_top"] + p.sens_H
        z["tp_bot"] = z["sens_top"] + p.sens_bump_h
        z["tp_top"] = z["tp_bot"] + p.t_tp_A
    else:
        z["cell_bot"] = z["bp_top"] + p.spacer_B
        z["cell_top"] = z["cell_bot"] + p.cell_H
        z["adapt_top"] = z["cell_top"] + p.spacer_B
        z["tp_bot"] = z["adapt_top"]
        z["tp_top"] = z["tp_bot"] + p.t_tp_B
    z["top"] = z["tp_top"] + p.t_shell
    # compartimento: comum as duas arquiteturas, dimensionado pela mais baixa (A)
    zA_tp_bot = p.h_foot + p.t_bp + p.sup_H + p.sens_H + p.sens_bump_h
    z["comp_top"] = zA_tp_bot - p.clear_top
    return z


def stops_of(arch):
    """(raio, ângulos) dos batentes de sobrecarga da arquitetura."""
    return (v("r_stop_" + arch), v("stop_angles_" + arch))


def loads():
    m_full = p.glp_mass + p.tara_mass
    W = m_full * p.g
    return {"m_full": m_full, "W_full": W, "W_impact": W * p.k_impact, "F_abuse": p.F_abuse}
