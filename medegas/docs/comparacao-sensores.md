# Comparação: Arquitetura A × Arquitetura B

**Nenhuma das duas foi escolhida.** Abaixo, o que o modelo e o FEM mostram hoje e o que falta saber para decidir.
Números de: `validation/interferencias_{A,B}.md`, `validation/fem_resultados.md` (carga nominal 275 N =
28 kg estimados; tara PENDENTE).

| Critério | A — 4 sensores de meia ponte | B — 1 célula single-point |
|---|---|---|
| Altura total | **36,5 mm** (dentro de 30–45) | **46,5 mm** (fora; depende da célula real) |
| Peças metálicas usinadas | 2 placas + 4 blocos | 2 placas + 2 espaçadores |
| Peças no caminho de carga | placa sup. → 4 sensores → 4 blocos → placa inf. | placa sup. → espaçador → célula → espaçador → placa inf. |
| Placa superior | Al **3 mm** basta: flecha 0,23 mm (centrado), 0,33 mm (25 mm excêntrico) | Al 3 mm **não** serve (flecha 4,7 mm, FS 1,6). Com 6 mm: 0,61 / 0,84 mm |
| Distribuição de carga | Sensores sob o anel do botijão: placa quase não flete; reações 25% cada (centrado), 17–29% (excêntrico) | Toda a carga num ponto: momento grande, placa trabalha em balanço até a borda oposta ao engaste (~235 mm) |
| Apoio parcial do anel (arco 90°) | Pior caso: 2 sensores levam 53% cada, 2 ficam **tracionados** (−3%) → o lado pesado levanta deles; flecha 1,2 mm, σ 162 MPa (pico em apoio rígido, superestimado) | Flecha 2,0 mm na borda, σ 91 MPa |
| Batentes em uso normal | No eixo de cada sensor, por fora (r=181): flexão da placa sobre eles ≤0,02 mm (≤3% da folga) em todos os casos. Na 1ª versão (entre sensores, na borda) chegava a 24% centrado e 127% no apoio parcial — achado do FEM que mudou o projeto | Placa 6 mm já consome 69% da folga de 0,8 mm centrado, 94% excêntrico: **batente encosta → leitura errada**. Exige placa mais rígida, reforço ou batentes reposicionados |
| Necessidade de reforço | Não, para os casos centrados/excêntricos | **Sim** (placa 6 mm, cruzeta ou nervuras) |
| Erro de excentricidade | Soma das 4 pontes compensa no HX711 se os sensores forem casados; desequilíbrio entre sensores vira erro | Célula single-point é feita para isso — **se** o tamanho de plataforma do datasheet cobrir Ø380 |
| Capacidade | 4 × 50 kg (kit típico) = 200 kg: usa ~15% da faixa → resolução menor, mas grande margem de sobrecarga | Célula 40–50 kg: melhor resolução, margem de sobrecarga pequena → batentes críticos |
| Espaço interno | Centro livre; compartimento na frente | Centro ocupado pela célula; compartimento igual |
| Montagem | 4 sensores a nivelar/casar; ligação em ponte completa exige respeitar cores/orientação do kit | 4 parafusos M6 com torque; menos ajuste |
| Manutenção | Trocar sensor exige recalibrar o conjunto | Trocar célula exige recalibrar; peça única mais cara |
| Custo estimado (faixa) | menor (kit barato) | maior (célula com datasheet + chapa 6 mm) |
| Fabricação | Mais peças, todas simples | Menos peças; placa grossa custa mais para cortar |

## Leitura de engenharia

- **A** casa melhor com o produto pedido (perfil baixo, placa fina, barata) porque põe os pontos de medição
  exatamente sob o anel do botijão. Seus riscos são **metrológicos**: casamento dos 4 sensores, ligação correta em
  ponte, retenção lateral do lado pesado sem desvio de força, e apoio parcial do anel (botijão amassado) levantando
  o lado pesado de 2 sensores.
- **B** é metrologicamente mais simples (1 sensor projetado para carga fora do centro), mas paga em **altura,
  rigidez e custo**: o modelo mostra que a placa vira o problema, e os batentes passam a encostar em uso normal.

## O que falta para decidir

1. Medidas reais do sensor do kit (A) e datasheet de uma célula candidata (B) — especialmente **tamanho máximo de
   plataforma** e **erro de canto**.
2. Ensaio de bancada de erro de canto das duas montagens com massas de referência (`validation/checklist.md` §3).
3. Deflexão real do sensor/célula na carga de uso, para fechar a folga dos batentes.
4. Medida do anel do botijão (Ø e planicidade): define o raio dos sensores em A e o caso de apoio parcial.
5. Decisão de altura: 30–45 mm é requisito ou preferência? Se requisito, B precisa de célula ≤ ~18 mm de altura ou
   placa fina + reforço.

**Sugestão de próximo passo (não é escolha):** comprar o kit A (barato) e montar o protótipo A primeiro para medir;
cotar uma célula B com datasheet completo em paralelo.
