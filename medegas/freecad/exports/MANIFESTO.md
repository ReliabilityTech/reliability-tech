# Manifesto de exportação

> Gerado por `scripts/export_models.py`. Todos os arquivos têm prefixo `PRELIMINAR_`: geometria **não validada**; não fabricar peças estruturais sem revisar `docs/riscos-e-validacoes.md`.

- `step/`: conjuntos completos e cada peça (intercâmbio CAD).
- `stl/`: só peças impressas (Exportar STL = sim). Tampa e base saem em 4 setores (Ø400 > mesa comum); os setores ainda **não** têm encaixe/colagem modelados.
- `dxf/`: contorno das chapas (corte laser/jato d'água) — furos conforme hipóteses atuais.
- `../parts/`: peças fabricadas como FCStd individuais (forma estática; a fonte paramétrica é `scripts/`).

## Arquitetura A

| Peça | Material | Fabricação | Status | Arquivos de manufatura |
|---|---|---|---|---|
| `Pe` | Borracha/EPDM com parafuso M4 embutido (comercial) | Comercial | PENDENTE | - |
| `Base_Inferior` | PETG ou ASA grafite fosco | Impressao 3D (4 setores colados p/ mesa < 400 mm) | HIPOTESE | PRELIMINAR_arq_a_Base_Inferior_setor1.stl, PRELIMINAR_arq_a_Base_Inferior_setor2.stl, PRELIMINAR_arq_a_Base_Inferior_setor3.stl, PRELIMINAR_arq_a_Base_Inferior_setor4.stl |
| `Tampa_Servico` | PETG/ASA | Impressao 3D | HIPOTESE | PRELIMINAR_arq_a_Tampa_Servico.stl |
| `Placa_Inferior` | Aluminio 5052-H32, 3 mm | Corte laser/jato d'agua + furacao | HIPOTESE | PRELIMINAR_arq_a_Placa_Inferior.dxf |
| `Compartimento` | PETG/ASA (V-0 preferivel) | Impressao 3D | HIPOTESE | PRELIMINAR_arq_a_Compartimento.stl |
| `Bateria` | Li-ion 18650 protegida | Comercial | PENDENTE | - |
| `Suporte_Bateria` | PETG/ASA | Impressao 3D | HIPOTESE | PRELIMINAR_arq_a_Suporte_Bateria.stl |
| `Suporte_ESP32` | PETG/ASA | Impressao 3D | HIPOTESE | PRELIMINAR_arq_a_Suporte_ESP32.stl |
| `ESP32_C3` | PCB comercial | Comercial | PENDENTE | - |
| `Suporte_HX711` | PETG/ASA | Impressao 3D | HIPOTESE | PRELIMINAR_arq_a_Suporte_HX711.stl |
| `HX711` | PCB comercial | Comercial | PENDENTE | - |
| `Carregador_PowerPath` | PCB comercial | Comercial | PENDENTE | - |
| `BuckBoost_3V3` | PCB comercial | Comercial | PENDENTE | - |
| `Suporte_Energia` | PETG/ASA | Impressao 3D | HIPOTESE | PRELIMINAR_arq_a_Suporte_Energia.stl |
| `Protecao_USB_C` | PETG/ASA | Impressao 3D | HIPOTESE | PRELIMINAR_arq_a_Protecao_USB_C.stl |
| `Tampa_USB_C` | TPU 95A | Impressao 3D (flexivel) | HIPOTESE | PRELIMINAR_arq_a_Tampa_USB_C.stl |
| `USB_C_Breakout` | PCB comercial | Comercial | PENDENTE | - |
| `Batente` | Aco zincado | Comercial | PENDENTE | - |
| `Sensor` | Aco liga c/ extensometros (comercial) | Comercial (kit 4x) | PENDENTE | - |
| `Suporte_Sensor` | Aluminio 6061, barra 50x14 | Serra + fresa/furadeira de bancada | HIPOTESE | - |
| `Guia_Sensor` | PETG | Impressao 3D | HIPOTESE | PRELIMINAR_arq_a_Guia_Sensor.stl |
| `Placa_Superior` | Aluminio 5052-H32, 3 mm | Corte laser/jato d'agua + furacao/rosca M3 | HIPOTESE | PRELIMINAR_arq_a_Placa_Superior.dxf |
| `Tampa_Superior` | PETG ou ASA grafite, face superior texturizada (mesa PEI texturizada) | Impressao 3D invertida (4 setores colados p/ mesa < 400 mm) | HIPOTESE | PRELIMINAR_arq_a_Tampa_Superior_setor1.stl, PRELIMINAR_arq_a_Tampa_Superior_setor2.stl, PRELIMINAR_arq_a_Tampa_Superior_setor3.stl, PRELIMINAR_arq_a_Tampa_Superior_setor4.stl |

## Arquitetura B

| Peça | Material | Fabricação | Status | Arquivos de manufatura |
|---|---|---|---|---|
| `Pe` | Borracha/EPDM com parafuso M4 embutido (comercial) | Comercial | PENDENTE | - |
| `Base_Inferior` | PETG ou ASA grafite fosco | Impressao 3D (4 setores colados p/ mesa < 400 mm) | HIPOTESE | PRELIMINAR_arq_b_Base_Inferior_setor1.stl, PRELIMINAR_arq_b_Base_Inferior_setor2.stl, PRELIMINAR_arq_b_Base_Inferior_setor3.stl, PRELIMINAR_arq_b_Base_Inferior_setor4.stl |
| `Tampa_Servico` | PETG/ASA | Impressao 3D | HIPOTESE | PRELIMINAR_arq_b_Tampa_Servico.stl |
| `Placa_Inferior` | Aluminio 5052-H32, 3 mm | Corte laser/jato d'agua + furacao | HIPOTESE | PRELIMINAR_arq_b_Placa_Inferior.dxf |
| `Compartimento` | PETG/ASA (V-0 preferivel) | Impressao 3D | HIPOTESE | PRELIMINAR_arq_b_Compartimento.stl |
| `Bateria` | Li-ion 18650 protegida | Comercial | PENDENTE | - |
| `Suporte_Bateria` | PETG/ASA | Impressao 3D | HIPOTESE | PRELIMINAR_arq_b_Suporte_Bateria.stl |
| `Suporte_ESP32` | PETG/ASA | Impressao 3D | HIPOTESE | PRELIMINAR_arq_b_Suporte_ESP32.stl |
| `ESP32_C3` | PCB comercial | Comercial | PENDENTE | - |
| `Suporte_HX711` | PETG/ASA | Impressao 3D | HIPOTESE | PRELIMINAR_arq_b_Suporte_HX711.stl |
| `HX711` | PCB comercial | Comercial | PENDENTE | - |
| `Carregador_PowerPath` | PCB comercial | Comercial | PENDENTE | - |
| `BuckBoost_3V3` | PCB comercial | Comercial | PENDENTE | - |
| `Suporte_Energia` | PETG/ASA | Impressao 3D | HIPOTESE | PRELIMINAR_arq_b_Suporte_Energia.stl |
| `Protecao_USB_C` | PETG/ASA | Impressao 3D | HIPOTESE | PRELIMINAR_arq_b_Protecao_USB_C.stl |
| `Tampa_USB_C` | TPU 95A | Impressao 3D (flexivel) | HIPOTESE | PRELIMINAR_arq_b_Tampa_USB_C.stl |
| `USB_C_Breakout` | PCB comercial | Comercial | PENDENTE | - |
| `Batente` | Aco zincado | Comercial | PENDENTE | - |
| `Celula_SinglePoint` | Aluminio (comercial) | Comercial | PENDENTE | - |
| `Espacador_Fixo` | Aluminio 6061 | Serra + furadeira | HIPOTESE | - |
| `Espacador_Carga` | Aluminio 6061 | Serra + furadeira | HIPOTESE | - |
| `Placa_Superior` | Aluminio 5052-H32, 6 mm | Corte laser/jato d'agua + furacao/rosca M3 | HIPOTESE | PRELIMINAR_arq_b_Placa_Superior.dxf |
| `Tampa_Superior` | PETG ou ASA grafite, face superior texturizada (mesa PEI texturizada) | Impressao 3D invertida (4 setores colados p/ mesa < 400 mm) | HIPOTESE | PRELIMINAR_arq_b_Tampa_Superior_setor1.stl, PRELIMINAR_arq_b_Tampa_Superior_setor2.stl, PRELIMINAR_arq_b_Tampa_Superior_setor3.stl, PRELIMINAR_arq_b_Tampa_Superior_setor4.stl |
