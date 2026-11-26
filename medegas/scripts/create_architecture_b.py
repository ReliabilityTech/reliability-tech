# -*- coding: utf-8 -*-
"""Gera freecad/MedeGas_Arquitetura_B.FCStd, o relatório validation/interferencias_B.md e os PNG.

Uso: xvfb-run -a freecad scripts/create_architecture_b.py   (ou abra no FreeCAD: Macro > Executar)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _arch_common  # noqa: E402

_arch_common.run("B")
