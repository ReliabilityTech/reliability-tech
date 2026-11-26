# -*- coding: utf-8 -*-
"""Gera freecad/MedeGas_Mestre.FCStd: as duas arquiteturas lado a lado (A na origem,
B em X=+600), cada uma com o botijão P13 de referência, mais as vistas explodidas
(Y=+600) e a planilha de parâmetros. Nenhuma arquitetura é escolhida aqui.

Uso: MEDEGAS_BATCH=1 xvfb-run -a freecad scripts/create_master_model.py
"""
import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_assembly import make_master_doc, finish_doc, quit_gui  # noqa: E402
import render  # noqa: E402

try:
    doc, zs, objs, path = make_master_doc()
    finish_doc(doc, path)
    render.shot(doc, "mestre_comparativo_A_B.png", ["Arquitetura_A", "Arquitetura_B"], w=2000, h=1200)
    bots = [o.Name for o in doc.Objects if o.Name.endswith("Botijao_P13_Referencia")]
    render.shot(doc, "mestre_explodidas_A_B.png", ["Explodida_A", "Explodida_B"], hide=bots, w=2000, h=1400)
    render._show_only(doc, ["Arquitetura_A", "Arquitetura_B"])
    doc.save()
except Exception:
    traceback.print_exc()
quit_gui()
