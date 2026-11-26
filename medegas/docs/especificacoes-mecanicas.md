# Especificações mecânicas (v0.1 — preliminar)

Fonte única: [`scripts/params.py`](../scripts/params.py) (também copiada na planilha `Parametros` de cada FCStd).
Cada parâmetro tem status:

- **CONFIRMADO** — decisão tomada ou valor de definição/norma (ex.: 13 kg de GLP no P13, boca do USB-C 8,94 × 3,26 mm).
- **HIPÓTESE** — escolha de projeto; pode mudar sem medir nada.
- **PENDENTE** — depende de medida real ou datasheet. **Nenhuma peça que dependa disso deve ser fabricada como final.**

## Cadeia de alturas (z, mm)

| Camada | Arq. A | Arq. B |
|---|---|---|
| Piso | 0 | 0 |
| Fundo da base impressa (folga ao piso 3 mm) | 3,0 | 3,0 |
| Topo dos pés / fundo da placa inferior | 5,0 | 5,0 |
| Topo da placa inferior (Al 3) | 8,0 | 8,0 |
| Topo do suporte do sensor (Al 14) / base da célula (espaçador 4) | 22,0 | 12,0 |
| Topo do sensor / topo da célula | 30,0 | 34,0 |
| Fundo da placa superior (ressalto 1 mm / espaçador 4) | 31,0 | 38,0 |
| Topo da placa superior (Al 3 / Al 6) | 34,0 | 44,0 |
| **Topo da tampa (altura total)** | **36,5** | **46,5** ⚠ fora da faixa 30–45 |
| Topo do compartimento eletrônico (comum às duas) | 28,5 | 28,5 |
| Linha de sombra (topo da base / fundo da saia) | 14,0 / 16,0 | 14,0 / 16,0 |

## Inconsistências e decisões encontradas na especificação

1. **Altura 30–45 mm × célula single-point**: com envelope genérico de célula (22 mm) + espaçadores + placa de
   6 mm, a Arq. B dá 46,5 mm. Fica dentro só com célula mais baixa ou placa superior mais fina com reforço — ver
   FEM.
2. **"Plataforma ~Ø400" × botijão Ø~360**: o botijão só toca o anel de base (Ø~310, PENDENTE). O Ø400 não é
   exigido pelo apoio; é escolha de estabilidade/estética. Também cria o problema de impressão (mesa < 400 mm).
3. **4 pontos de pesagem × estabilidade**: na Arq. A, o lado pesado bascula sobre os 4 sensores (braço mínimo
   106 mm). Separado disso, o conjunto tomba sobre os **pés**, que são lado solo e podem ser 8 em r=180. Ver
   `validation/interferencias_A.md`, seção 5.
4. **Placa estrutural inferior na Arq. A**: com pés logo abaixo dos sensores ela quase não trabalha; foi mantida
   (pedido do escopo, e dá base rígida e plana para sensores, batentes e base impressa). Candidata a otimização.
5. **"MedeGás.FCStd" duas vezes** na estrutura de pastas pedida: interpretado como mestre + Arq. A + Arq. B.
   Nomes de arquivo em ASCII (`MedeGas_*`) para evitar problemas de codificação entre sistemas.
6. **Recarga com botijão sobre a plataforma**: mecanicamente não altera a leitura (USB-C no lado solo), mas
   continua **desaconselhada** até avaliação térmica/elétrica — mantida a premissa do escopo.

## Parâmetros PENDENTES (precisam de medida)

| Grupo | Parâmetros | Como medir |
|---|---|---|
| Botijão P13 | `bot_D`, `bot_H`, `bot_ring_D`, `bot_ring_t`, `bot_ring_h`, `bot_collar_D`, `bot_cg_h`, `tara_mass` | Paquímetro/trena em ≥3 botijões de marcas diferentes; tara na alça |
| Sensor meia ponte | `sens_L/W/H`, `sens_bump_d/h`, `sens_cap`, `sup_pocket`, `sup_pocket_h` | Paquímetro no sensor do kit; deflexão com relógio comparador |
| Célula single-point | `cell_L/W/H`, `cell_hole_pitch`, `cell_mount_len`, `cell_cap`, `cell_plat_max` | Datasheet do fabricante |
| Eletrônica | `esp_*`, `hx_*`, `chg_*`, `bb_*`, `bat_d`, `bat_L`, `usb_pcb_*` | Paquímetro nas placas compradas |
| Pés | `d_foot`, `h_foot` | Pé comprado, sob carga |
| Batentes | `gap_stop` | Deflexão real (sensor + placa) na carga máxima de uso + margem |

## Geometria de referência do botijão

O objeto `Botijao_P13_Referencia` (separado, translúcido) é **aproximado**: corpo cilíndrico Ø360, tampos
elipsoidais 2:1, anel de base Ø310 × 60 mm, colarinho Ø220 com aberturas de alça, válvula esquemática. Serve só
para visualizar relação de tamanho, apoio pelo anel e altura do CG. Não usar como dado de projeto.
