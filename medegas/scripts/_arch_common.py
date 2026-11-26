# -*- coding: utf-8 -*-
"""Rotina comum aos scripts create_architecture_*.py."""
import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_assembly import make_arch_doc, finish_doc, quit_gui, ROOT  # noqa: E402
import checks  # noqa: E402
import render  # noqa: E402


def run(arch):
    try:
        doc, z, objs, path = make_arch_doc(arch)
        parts = [pt for _, pt in objs]
        rep, hits, dmin = checks.run(arch, parts, z)
        vdir = os.path.join(ROOT, "validation")
        os.makedirs(vdir, exist_ok=True)
        with open(os.path.join(vdir, "interferencias_%s.md" % arch), "w", encoding="utf-8") as f:
            f.write("# Relatório automático de verificação geométrica — Arquitetura %s\n\n" % arch)
            f.write("> Gerado por `scripts/create_architecture_%s.py` (`scripts/checks.py`). "
                    "Não editar à mão: rode o script de novo.\n\n" % arch.lower())
            f.write(rep)
        print(rep)
        finish_doc(doc, path)
        a = "Arquitetura_%s" % arch
        tag = arch.lower()
        bot = [o.Name for o in doc.Objects if o.Name.endswith("Botijao_P13_Referencia")]
        render.shot(doc, "arq_%s_iso_com_botijao.png" % tag, [a])
        render.shot(doc, "arq_%s_iso.png" % tag, [a], hide=bot)
        cover = [o.Name for o in doc.Objects if o.Name.startswith(a) and o.Name.endswith(("Tampa_Superior", "Placa_Superior"))]
        render.shot(doc, "arq_%s_interno_sem_tampa.png" % tag, [a], hide=bot + cover, view="iso")
        render.shot(doc, "arq_%s_topo_sem_tampa.png" % tag, [a], hide=bot + cover, view="top")
        render.shot(doc, "arq_%s_inferior.png" % tag, [a], hide=bot, view="bottom")
        render.shot(doc, "arq_%s_explodida.png" % tag, ["Vista_Explodida"],
                    hide=[o.Name for o in doc.Objects if o.Name.endswith("Botijao_P13_Referencia")], w=1400, h=1800)
        render.shot(doc, "arq_%s_corte_yz.png" % tag, ["Corte_YZ"],
                    hide=[o.Name for o in doc.Objects if o.Name.endswith("Botijao_P13_Referencia")], view="iso")
        render.shot(doc, "arq_%s_corte_sensores.png" % tag, ["Corte_Sensores"],
                    hide=[o.Name for o in doc.Objects if o.Name.endswith("Botijao_P13_Referencia")], view="iso")
        # estado final salvo: montagem visível
        render._show_only(doc, [a])
        doc.save()
    except Exception:
        traceback.print_exc()
    quit_gui()
