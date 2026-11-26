# Lista de materiais (protótipo v0.1)

Lista por peça gerada do modelo: folha 2 dos PDF (`freecad/exports/pdf/`) e planilha `Lista_de_Pecas` nos FCStd.
Abaixo, a lista de **compra**. Preços são **faixas de ordem de grandeza para planejar** o orçamento de ~R$ 500 —
não são cotações; cotar antes de comprar.

| # | Item | Qtd | Arq. | Status | Faixa (R$) | Observação |
|---|---|---|---|---|---|---|
| 1 | Kit 4 sensores meia ponte 50 kg + HX711 | 1 | A | PENDENTE | 25–60 | Medir sensor do kit antes de fabricar suportes |
| 2 | Célula single-point (capacidade ≥ 40–50 kg, plataforma ≥ 400 mm no datasheet) | 1 | B | PENDENTE | 80–250 | Exigir datasheet com tamanho de plataforma e erro de canto |
| 3 | Módulo HX711 (avulso, se B) | 1 | B | PENDENTE | 10–20 | |
| 4 | ESP32-C3 SuperMini | 1 | A/B | PENDENTE | 20–40 | |
| 5 | Célula 18650 protegida (marca rastreável) | 1 | A/B | PENDENTE | 25–50 | Evitar célula sem origem |
| 6 | Carregador Li-ion + power path, USB-C | 1 | A/B | PENDENTE | 10–40 | Componente não escolhido |
| 7 | Buck-boost 3,3 V | 1 | A/B | PENDENTE | 10–30 | Idem |
| 8 | Breakout USB-C | 1 | A/B | PENDENTE | 5–15 | |
| 9 | Chapa Al 5052 3 mm Ø384 + Ø380, cortada | 2 | A | HIPÓTESE | 80–180 | Corte laser terceirizado |
| 10 | Chapa Al 6 mm Ø380 (placa sup. B) | 1 | B | HIPÓTESE | 80–200 | Ou 3 mm + reforço (ver FEM) |
| 11 | Barra Al 6061 50×14 (~200 mm) | 1 | A | HIPÓTESE | 20–40 | 4 suportes |
| 12 | Filamento PETG/ASA grafite (~600 g) + TPU (~10 g) | — | A/B | HIPÓTESE | 60–120 | Tampa+base ≈ 500–600 g |
| 13 | Pés de borracha com M4 | 8 | A/B | PENDENTE | 15–30 | |
| 14 | Espaçadores M6 + parafusos de ajuste | 4–5 | A/B | HIPÓTESE | 10–25 | |
| 15 | Parafusaria M2/M3/M4/M6, abraçadeiras, cabo 4 vias blindado, JST | — | A/B | HIPÓTESE | 20–40 | |

Leitura rápida do orçamento (faixas somadas, sem frete/impressão terceirizada):

- **Arquitetura A**: ~R$ 330–700 — cabe nos R$ 500 com chapas e filamento no limite inferior.
- **Arquitetura B**: ~R$ 390–900 — célula com datasheet decente e placa de 6 mm pressionam o orçamento.

Itens não incluídos: massas de referência para calibração/ensaio (podem ser emprestadas: halteres/anilhas
aferidos em balança confiável), impressão grande formato terceirizada (se for o caminho).
