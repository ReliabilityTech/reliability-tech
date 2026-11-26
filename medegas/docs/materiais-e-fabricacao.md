# Materiais e fabricação

Orçamento-alvo do protótipo completo: **~R$ 500**. Regra: nada impresso é o único elemento do caminho de carga.

## Por peça

| Peça | Material | Processo | Por quê |
|---|---|---|---|
| Placa superior | Al 5052-H32 — 3 mm (A) / 6 mm (B, provisório) | Corte laser ou jato d'água; furos M3 roscados | Caminho estrutural; 5052 dobra/corta bem, não enferruja. Espessura de B depende do FEM/reforço |
| Placa inferior | Al 5052-H32, 3 mm | Corte laser/jato | Base rígida dos sensores, pés e batentes. Na Arq. A quase não flete (pés perto dos sensores) — pode virar aço galvanizado 2 mm se for mais barato |
| Suportes dos sensores (A) | Al 6061, barra 50 × 14 | Serra + furadeira de bancada + fresa simples (rebaixo 24×24×2) | No caminho de carga: metálico, não impresso |
| Espaçadores da célula (B) | Al 6061 | Serra + furadeira | Idem |
| Batentes de sobrecarga | Espaçador sextavado M6 + parafuso de ajuste + contraporca | Comercial | Ajuste fino da folga com calibrador de lâminas |
| Tampa superior | PETG ou ASA grafite | Impressão 3D invertida, face de cima na mesa PEI texturizada | Acabamento fosco sem pós-processo; logotipo sai na face da mesa |
| Base inferior | PETG ou ASA grafite | Impressão 3D | Só fecha e protege |
| Compartimento, tampa de serviço, suportes eletrônicos | PETG/ASA (V-0 preferível perto da bateria) | Impressão 3D | Não estruturais |
| Tampa do USB-C | TPU 95A | Impressão 3D flexível | Proteção contra poeira; **não** é vedação certificada |
| Pés | Borracha/EPDM com parafuso M4 | Comercial | Antiderrapante; altura/dureza mudam a folga do fundo |

## Impressão: Ø400 não cabe na maioria das mesas

Tampa e base têm Ø400. Mesas comuns: 220–256 mm; grandes formato: 350+. Opções:

1. **Imprimir em 4 setores** (o `export_models.py` já fatia o STL) e colar. Juntas da tampa ficam sobre a placa de
   alumínio (não carregadas em flexão). **Pendente:** modelar encaixe macho-fêmea/cauda de andorinha nas juntas.
2. Terceirizar impressão grande formato (custo maior).
3. Reduzir o diâmetro: só o anel do botijão (Ø~310, PENDENTE) precisa de apoio; Ø~350 pode bastar, mas reduz a
   base de tombamento — decidir depois de medir o botijão e ensaiar estabilidade.

## Temperatura, fluência e sol

- PLA amolece a ~55–60 °C: área de serviço com sol/forno pode passar disso. **Usar PETG (Tg ~80 °C) ou ASA
  (~100 °C, resiste a UV)**. Evitar PLA mesmo em peças não estruturais.
- Fluência: como a tampa impressa fica comprimida entre o anel e a placa de alumínio em área grande, a fluência só
  achata a pele (não muda a leitura, já que toda a força passa pelo sensor). A tampa **não** pode ser apoio em
  vão livre — por isso o anel do botijão precisa ficar sobre a placa (ver risco R-07).

## Fixadores (todos comerciais, inox ou zincado)

| Uso | Item | Qtd A | Qtd B |
|---|---|---|---|
| Pés → placa inferior | M4 (embutido no pé) + porca | 8 | 8 |
| Suportes dos sensores → placa inf. | M4 × 20 cabeça cilíndrica | 8 | — |
| Célula → espaçadores/placas | M6 classe 8.8 (comprimento conforme célula) | — | 4 |
| Batentes | Espaçador M6 + parafuso de ajuste + contraporca | 4 | 5 |
| Tampa → placa superior (abas) | M3 × 8 | 6 | 6 |
| Base impressa → placa inferior | M3 × 8 | 4 | 4 |
| Compartimento → placa inferior | M3 × 8 | 4 | 4 |
| Tampa de serviço → compartimento | M3 × 10 escareado | 4 | 4 |
| HX711 | M2 × 6 autoatarraxante | 4 | 4 |
