# Riscos e validações

> **O protótipo não está validado para uso com botijão cheio.** Ensaios começam com massas de referência em
> condições controladas (`validation/checklist.md`). Simulação não substitui ensaio físico nem avaliação
> profissional de segurança.

## Riscos abertos

| ID | Risco | Evidência no modelo | Mitigação proposta | Estado |
|---|---|---|---|---|
| R-01 | Desvio de força (lado pesado tocando lado solo) → leitura errada | Verificação automática: menor folga = batente 0,8 mm; labirinto 1,5 mm | Folgas paramétricas; checar após cada mudança; lâmina de 1 mm no ensaio | Controlado no modelo |
| R-02 | Batente encosta em uso normal (flexão da placa + deflexão do sensor > folga) | FEM: B 6 mm consome 69–94% da folga (138–187% com impacto); A, com batentes no eixo dos sensores, ≤3% | A: resolvido no modelo (falta somar a deflexão real do sensor). B: placa mais rígida/reforço/batentes perto do engaste. Medir deflexão real | A: mitigado no modelo · B: **aberto** |
| R-03 | Botijão tomba com mais facilidade sobre a plataforma | Estático: 34° no chão → ~32° (A) / 31° (B) sobre 8 pés em r=180 | Pés no maior raio possível; mais pés; reduzir altura; ensaio em plano inclinado | **Aberto** (redução pequena, mas existe) |
| R-04 | Plataforma desliza no piso | Não modelado | Pés de borracha macia; ensaio em piso molhado | Aberto |
| R-05 | Apoio parcial do anel (botijão amassado/inclinado): na A, 2 sensores ficam tracionados (o lado pesado levanta deles) | FEM A_LC3: reações −3% em 2 sensores, flecha 1,2 mm | Retenção do lado pesado; placa mais rígida na A; aceitar leitura inválida + detectar por software (desequilíbrio) | Aberto |
| R-06 | Sobrecarga (pessoa pisa) danifica sensor | Batentes modelados; capacidade A 200 kg (kit), B 40–50 kg | Batentes ajustados; ensaio 100 kg na borda | Aberto |
| R-07 | Botijão fora de centro com o anel além da borda da placa (r>190) apoia só na tampa impressa (fluência, quebra) | Com excentricidade >~35 mm o anel (r=155) passa de R=190 | Anel-guia em baixo-relevo; considerar ressalto de centragem suave; placa maior | Aberto |
| R-08 | Impacto ao apoiar o botijão (fator dinâmico) | Hipótese k=2; FS com impacto em `fem_resultados.md` | Ensaio de queda controlada | Aberto |
| R-09 | PLA/PETG amolece ao sol/calor | — | PETG/ASA; nada impresso no caminho de carga | Mitigado no projeto |
| R-10 | Bateria Li-ion: superaquecimento/curto em área com GLP | Compartimento fechado, lado solo, longe da válvula | Célula protegida, carregador com proteção, recarga com botijão fora, ensaio térmico; considerar LiFePO4 ou pilhas | **Aberto — segurança** |
| R-11 | Ruído de RF/sinal: placas de Al blindam a antena; buck-boost perto do HX711 | Antena voltada para a parede plástica | Teste de alcance; separar/blindar HX711 | Aberto |
| R-12 | Componentes com dimensões erradas | Todos marcados PENDENTE | Medir antes de fabricar | Aberto |
| R-13 | Tampa/base Ø400 não cabem na impressora | Exportação em 4 setores | Modelar encaixe; ou terceirizar | Aberto |
| R-14 | Fluência/deriva do sensor de baixo custo ao longo de dias | — | Ensaio de 24 h; compensação de zero com botijão trocado | Aberto |

## Limites do estudo FEM (`scripts/fem_study.py`)

- Só a **placa superior**, linear elástica, pequenos deslocamentos; Al 5052-H32 com propriedades típicas de
  handbook (não certificado).
- Sensores/célula como **apoios rígidos**; contato unilateral não modelado (por isso aparecem reações negativas no
  caso de apoio parcial — na realidade a placa levantaria).
- Carga como forças nodais iguais na projeção do anel; tampa impressa ignorada.
- Malha tet10 ~5 mm, **sem estudo de convergência**. Picos de tensão em apoios rígidos são singularidades —
  usar ordem de grandeza.
- A carga aplicada é conferida: a soma das reações tem de bater com a carga (±1%), senão o caso falha. Esse
  controle pegou um defeito real do gravador de pressão do FreeCAD (só ~55% da carga chegava aos apoios).
- Não estudado: placa inferior, suportes, parafusos, fadiga, impacto dinâmico real, temperatura.
