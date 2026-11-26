# -*- coding: utf-8 -*-
"""Verificações geométricas automáticas do MedeGás.

1. Interferência (volume comum) entre todas as peças sólidas.
2. Caminho de carga: menor distância entre o lado PESADO e o lado SOLO.
   Deve ser > 0 em toda parte; o menor valor esperado é a folga dos batentes.
3. Sensores tocam os dois lados (fazem a ponte).
4. Botijão só toca a tampa superior.
5. Estabilidade geométrica ao tombamento (estática, simplificada).
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from params import p, stack, loads  # noqa: E402
import medegas_lib as L  # noqa: E402

TOL_VOL = 1e-2  # mm³
SKIP = {"Cabos"}  # ilustrativos, atravessam rasgos de propósito


def _bb_overlap(a, b, m=0.0):
    A, B = a.BoundBox, b.BoundBox
    return not (A.XMax + m < B.XMin or B.XMax + m < A.XMin or A.YMax + m < B.YMin or B.YMax + m < A.YMin
                or A.ZMax + m < B.ZMin or B.ZMax + m < A.ZMin)


def interference(parts):
    hits = []
    ps = [pt for pt in parts if pt["name"] not in SKIP]
    for i in range(len(ps)):
        for j in range(i + 1, len(ps)):
            a, b = ps[i], ps[j]
            if not _bb_overlap(a["shape"], b["shape"]):
                continue
            try:
                v = a["shape"].common(b["shape"]).Volume
            except Exception as ex:
                hits.append((a["name"], b["name"], float("nan"), str(ex)))
                continue
            if v > TOL_VOL:
                hits.append((a["name"], b["name"], v, ""))
    return hits


def min_dist(group1, group2, margin=30.0):
    best = (1e9, None, None)
    for a in group1:
        for b in group2:
            if not _bb_overlap(a["shape"], b["shape"], margin):
                continue
            d = a["shape"].distToShape(b["shape"])[0]
            if d < best[0]:
                best = (d, a["name"], b["name"])
    return best


def stability(arch, z):
    """Ângulo de tombamento estático do conjunto (botijão + plataforma).

    A aresta de tombamento do conjunto é o polígono dos pés (lado solo, rígido
    até os batentes encostarem). A distância mínima do centro à aresta do
    polígono regular de n pés em raio r é r·cos(180°/n)."""
    n, r = p.n_feet, p.r_feet
    d_feet = r * math.cos(math.pi / n) - p.d_foot / 2 * 0  # aresta passa pelo centro do pé (conservador)
    h_cg = p.bot_cg_h + z["top"]
    d_bot = p.bot_ring_D / 2
    res = {
        "d_pes": d_feet,
        "h_cg": h_cg,
        "ang_plataforma": math.degrees(math.atan2(d_feet, h_cg)),
        "ang_botijao_no_chao": math.degrees(math.atan2(d_bot, p.bot_cg_h)),
    }
    if arch == "A":
        ns, rs = p.n_sens, p.r_sens
        d_s = rs * math.cos(math.pi / ns)
        res["d_sensores"] = d_s
        res["ang_sobre_sensores"] = math.degrees(math.atan2(d_s, h_cg))
    return res


def run(arch, parts, z):
    out = []
    w = out.append
    w("## Arquitetura %s\n" % arch)
    w("Cadeia de alturas: " + ", ".join("%s=%.1f" % (k, v) for k, v in z.items()) + "\n")
    w("Altura total da plataforma: **%.1f mm** (meta preliminar 30-45 mm)%s\n"
      % (z["top"], "" if 30 <= z["top"] <= 45 else " — **FORA da faixa preliminar**"))
    hits = interference(parts)
    w("### 1. Interferências (volume comum > %.2g mm³)\n" % TOL_VOL)
    if hits:
        for a, b, v, err in hits:
            w("- **%s × %s**: %.2f mm³ %s" % (a, b, v, err))
    else:
        w("- Nenhuma interferência entre %d peças sólidas (cabos ilustrativos excluídos)." % len([x for x in parts if x["name"] not in SKIP]))
    w("")
    heavy = [x for x in parts if x["side"] == "PESADO"]
    ground = [x for x in parts if x["side"] == "SOLO" and x["name"] not in SKIP]
    bridge = [x for x in parts if x["side"] == "PONTE"]
    bottle = [x for x in parts if x["side"] == "REFERENCIA"]
    d, a, b = min_dist(heavy, ground)
    w("### 2. Caminho de carga (lado pesado × lado solo)\n")
    w("- Menor folga: **%.2f mm** entre `%s` e `%s`." % (d, a, b))
    stopnames = [x["name"] for x in ground if x["name"].startswith("Batente")]
    ok = d > 0.3
    w("- %s" % ("OK: nenhum desvio de força (force shunt) em repouso." if ok else "**FALHA: possível desvio de força.**"))
    # menor folga ignorando batentes (o resto deve ter folga maior que o batente)
    d2, a2, b2 = min_dist(heavy, [x for x in ground if x["name"] not in stopnames])
    w("- Menor folga sem contar os batentes: **%.2f mm** (`%s` × `%s`). Precisa ser maior que a folga do batente "
      "(%.2f mm) para que, em sobrecarga, o batente encoste antes de qualquer outra peça. %s"
      % (d2, a2, b2, p.gap_stop, "OK." if d2 > p.gap_stop + 0.2 else "**REVISAR.**"))
    w("")
    w("### 3. Sensores fazendo a ponte\n")
    for s in bridge:
        dh = min(s["shape"].distToShape(h["shape"])[0] for h in heavy)
        dg = min(s["shape"].distToShape(g["shape"])[0] for g in ground)
        w("- `%s`: distância ao lado pesado %.3f mm, ao lado solo %.3f mm %s"
          % (s["name"], dh, dg, "(OK: toca os dois)" if dh < 1e-3 and dg < 1e-3 else "**(REVISAR)**"))
    w("")
    if bottle:
        w("### 4. Botijão de referência\n")
        bt = bottle[0]
        cov = [x for x in parts if x["name"] == "Tampa_Superior"][0]
        dc = bt["shape"].distToShape(cov["shape"])[0]
        dg, ga, gb = min_dist([bt], ground, 50)
        w("- Distância botijão → tampa superior: %.3f mm (apoio)." % dc)
        w("- Menor distância botijão → lado solo: %.2f mm (`%s`). %s"
          % (dg, gb, "OK" if dg > 1.0 else "**REVISAR: botijão encostaria no lado solo**"))
        r_ring = p.bot_ring_D / 2
        w("- Anel de base do botijão (Ø%.0f, PENDENTE) dentro do diâmetro útil da tampa (Ø%.0f): %s"
          % (p.bot_ring_D, p.D_ext - 2 * p.r_round_top, "OK" if r_ring < p.D_ext / 2 - p.r_round_top else "FALHA"))
        if arch == "A":
            w("- Raio dos sensores %.0f mm × raio médio do anel %.1f mm: diferença %.1f mm (quanto menor, menor a flexão da placa superior)."
              % (p.r_sens, r_ring - p.bot_ring_t / 2, abs(p.r_sens - (r_ring - p.bot_ring_t / 2))))
        w("")
    st = stability(arch, z)
    lo = loads()
    w("### 5. Estabilidade ao tombamento (estática, simplificada)\n")
    w("- Botijão cheio estimado: %.1f kg (tara PENDENTE %.1f kg + GLP %.1f kg) → %.0f N."
      % (lo["m_full"], p.tara_mass, p.glp_mass, lo["W_full"]))
    w("- CG do conjunto a %.0f mm do chão (CG do botijão PENDENTE: %.0f mm + plataforma %.1f mm)."
      % (st["h_cg"], p.bot_cg_h, z["top"]))
    w("- Botijão direto no chão: braço %.0f mm → tomba a **%.1f°**." % (p.bot_ring_D / 2, st["ang_botijao_no_chao"]))
    w("- Sobre a plataforma, polígono de %d pés em r=%.0f mm: braço mínimo %.0f mm → tomba a **%.1f°**."
      % (p.n_feet, p.r_feet, st["d_pes"], st["ang_plataforma"]))
    if arch == "A":
        w("- Antes disso, a placa superior pode *bascular sobre os sensores*: braço mínimo %.0f mm → %.1f°. "
          "Acima desse ângulo a placa levanta de 2 sensores e se apoia nos batentes (leitura inválida, mas sem queda "
          "se a placa estiver retida lateralmente)." % (st["d_sensores"], st["ang_sobre_sensores"]))
    w("- Leitura: a plataforma %s o ângulo de tombamento em relação ao botijão direto no chão. "
      "Cálculo estático; não considera piso inclinado, empurrão dinâmico ou deslizamento — validar em ensaio."
      % ("preserva ou melhora" if st["ang_plataforma"] >= st["ang_botijao_no_chao"] - 0.5 else "**reduz**"))
    w("")
    return "\n".join(out), hits, d
