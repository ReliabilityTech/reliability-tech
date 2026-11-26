# Montagem, desmontagem e manutenção

Vista explodida: `freecad/exports/png/arq_*_explodida.png`, folha 2 dos PDF, grupo `Vista_Explodida` nos FCStd
(App::Link — acompanha qualquer mudança das peças).

## Sequência (Arquitetura A)

1. **Placa inferior**: parafusar os 8 pés (M4).
2. **Suportes dos sensores**: 2× M4 cada, cabeças embutidas no bloco. Conferir planicidade relativa dos 4 topos
   (≤0,1 mm, PENDENTE) — diferença vira pré-carga desigual.
3. **Sensores** sobre os suportes, encaixados nas guias impressas; fios voltados para o centro.
4. **Batentes**: espaçadores M6 na placa inferior, parafuso de ajuste ainda baixo.
5. **Cabos** dos sensores roteados sobre a placa inferior (abraçadeiras adesivas) até as janelas laterais do
   compartimento. Nunca prender cabo no lado pesado.
6. **Bandeja eletrônica** (tampa de serviço) montada fora: suporte da bateria, ESP32, HX711, carregador,
   buck-boost; conectar. Encaixar o **compartimento** por cima e fixar na placa inferior (abas, 4× M3).
7. **Base inferior** por baixo: pés passam nos furos; 4× M3 na placa. Encaixar moldura + breakout **USB-C**.
8. **Lado pesado**: tampa superior virada para baixo, placa superior dentro, 6× M3 pelas abas.
9. Apoiar o lado pesado sobre os ressaltos dos 4 sensores, conferindo que a saia da tampa ficou por fora do lábio
   da base (labirinto) sem encostar.
10. **Ajustar batentes**: calibrador de lâminas de 0,8 mm (PENDENTE) entre topo do batente e placa superior;
    travar contraporca. Ajuste exige acesso: hoje é feito antes do passo 9 com gabarito — **pendente** definir
    furo de acesso pela tampa ou ajuste por baixo.
11. Conferir **folga em todo o perímetro** (lâmina de 1 mm deve passar entre tampa e base) e tara/calibração.

Arquitetura B: passos 2–3 viram espaçador fixo + célula (2× M6) e espaçador de carga (2× M6); a placa superior
parafusa no espaçador de carga (2× M6).

## Manutenção sem abrir o lado pesado

- **Bateria/eletrônica**: virar a plataforma (sem botijão), remover 4× M3 da tampa de serviço — a eletrônica sai
  junto, como gaveta. Conector entre bandeja e cabos dos sensores/USB (PENDENTE: escolher JST-PH/XH).
- **Recarga**: USB-C no lado solo (cabo não altera leitura). Procedimento recomendado até validação térmica:
  **recarregar com o botijão fora da plataforma**, em local ventilado.
- **Sensores**: exige retirar o lado pesado (tampa + placa: só apoiados, sem parafusos aos sensores na Arq. A).

## Pendências de montagem

- Retenção lateral do lado pesado na Arq. A (hoje só o labirinto limita — encostar nele é desvio de força).
  Opções: copo/anel no ressalto do sensor, pino-guia com folga radial. **Decidir com o kit real em mãos.**
- Acesso para ajustar batentes com o conjunto fechado.
- Encaixe entre setores impressos.
