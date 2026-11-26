# Estudo FEM da placa estrutural superior — resultados

> Gerado por `scripts/fem_study.py` (FreeCAD FEM + Gmsh + CalculiX). Não editar à mão.

## Hipóteses (todas precisam de validação)

- Material: Al 5052-H32 (valores tipicos), E=70300 MPa, ν=0.33; escoamento típico 193 MPa (handbook, **não** certificado).
- Carga nominal: botijão cheio estimado 28.0 kg → **275 N** (tara PENDENTE). Análise linear: para o fator de impacto de apoio k=2.0 (HIPÓTESE), multiplique deslocamentos e tensões por 2.0.
- Carga aplicada como forças nodais iguais nos nós da face superior dentro da projeção do anel de base (Ø310 × 3 mm, PENDENTE). A tampa impressa entre o anel e a placa foi ignorada (tende a espalhar a carga: conservador para tensão local).
- Arq. A: 4 apoios de Ø6 mm (ressalto do sensor) só em Z, rígidos. Arq. B: engaste rígido na área do espaçador da extremidade de carga (40 × 30 mm). **A flexibilidade do próprio sensor/célula não está no modelo.**
- Malha tetraédrica de 2ª ordem (Gmsh), tamanho máx. 5.0 mm. Estudo de convergência de malha: **não feito**.
- Tensões em apoios pontuais/engastes rígidos têm singularidade numérica: o pico local depende da malha e superestima a tensão real; use a ordem de grandeza, não o número exato.

## Resultados (carga nominal)

| Caso | Descrição | t (mm) | Nós | Flecha máx. (mm) | σ von Mises máx. (MPa) | FS escoamento nominal | FS com impacto ×2.0 |
|---|---|---|---|---|---|---|---|
| `A_LC1_central` | Botijao centrado, anel completo | 3 | 263210 | 0.226 | 25.5 | 7.6 | 3.8 |
| `A_LC2_excentrico` | Botijao deslocado 25 mm na direcao do sensor 1 | 3 | 110799 | 0.331 | 30.5 | 6.3 | 3.2 |
| `A_LC3_arco90` | Apoio parcial: arco de 90 graus entre dois sensores (anel amassado/inclinado) | 3 | 212135 | 1.206 | 162.4 | 1.2 | 0.6 |
| `B_LC1_central_6mm` | Botijao centrado, placa 6mm | 6 | 80406 | 0.608 | 35.4 | 5.5 | 2.7 |
| `B_LC2_excentrico_6mm` | Botijao deslocado 25 mm para -X (longe do engaste) | 6 | 80522 | 0.836 | 44.4 | 4.3 | 2.2 |
| `B_LC3_arco90_6mm` | Apoio parcial: arco de 90 graus no lado oposto ao engaste | 6 | 81172 | 1.986 | 90.6 | 2.1 | 1.1 |
| `B_LC1_central_3mm` | Botijao centrado, placa 3mm | 3 | 75513 | 4.716 | 117.9 | 1.6 | 0.8 |

## Folga dos batentes de sobrecarga (0.8 mm, PENDENTE)

Deslocamento vertical da placa sobre cada batente (só a flexão da placa; somar a deflexão do sensor/célula medida em ensaio). Se |uz| se aproximar da folga, o batente encosta em uso normal e **desvia força** (leitura errada).

**Arquitetura A** (batentes em r=181 mm)

| Caso | batente 45° | batente 135° | batente 225° | batente 315° | pior × folga | com impacto |
|---|---|---|---|---|---|---|
| `A_LC1_central` | 0.003 | 0.002 | 0.002 | 0.002 | -0% | -1% |
| `A_LC2_excentrico` | -0.022 | 0.002 | 0.012 | 0.003 | 3% | 6% |
| `A_LC3_arco90` | 0.012 | -0.004 | -0.005 | 0.011 | 1% | 1% |

**Arquitetura B** (batentes em r=172 mm)

| Caso | batente 0° | batente 90° | batente 180° | batente 240° | batente 300° | pior × folga | com impacto |
|---|---|---|---|---|---|---|---|
| `B_LC1_central_6mm` | -0.016 | -0.245 | -0.550 | -0.393 | -0.119 | 69% | 137% |
| `B_LC2_excentrico_6mm` | 0.036 | -0.260 | -0.749 | -0.485 | -0.081 | 94% | 187% |
| `B_LC3_arco90_6mm` | 0.147 | -0.196 | -1.778 | -0.831 | 0.128 | 222% | 445% |
| `B_LC1_central_3mm` | -0.148 | -1.905 | -4.264 | -3.052 | -0.938 | 533% | 1066% |

## Reações nos apoios (soma = carga)

- `A_LC1_central`: APOIO_SENSOR_1 = 69.2 N (25%), APOIO_SENSOR_2 = 68.2 N (25%), APOIO_SENSOR_3 = 68.3 N (25%), APOIO_SENSOR_4 = 69.1 N (25%) — soma 274.7 N
- `A_LC2_excentrico`: APOIO_SENSOR_1 = 73.6 N (27%), APOIO_SENSOR_2 = 76.8 N (28%), APOIO_SENSOR_3 = 45.7 N (17%), APOIO_SENSOR_4 = 78.6 N (29%) — soma 274.7 N
- `A_LC3_arco90`: APOIO_SENSOR_1 = 146.1 N (53%), APOIO_SENSOR_2 = -8.4 N (-3%), APOIO_SENSOR_3 = -8.5 N (-3%), APOIO_SENSOR_4 = 145.5 N (53%) — soma 274.7 N
- `B_LC1_central_6mm`: ENGASTE_CELULA = 274.7 N (100%) — soma 274.7 N
- `B_LC2_excentrico_6mm`: ENGASTE_CELULA = 274.7 N (100%) — soma 274.7 N
- `B_LC3_arco90_6mm`: ENGASTE_CELULA = 274.7 N (100%) — soma 274.7 N
- `B_LC1_central_3mm`: ENGASTE_CELULA = 274.7 N (100%) — soma 274.7 N
