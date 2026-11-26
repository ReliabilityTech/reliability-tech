# Checklist de validação

Marque só com evidência (foto, medição, planilha de ensaio). Ordem sugerida: medir → revisar modelo → ensaiar
com massas de referência → só então botijão vazio → só então botijão cheio.

## 1. Medições antes de fabricar (atualizar `scripts/params.py`, status → CONFIRMADO)

- [ ] Botijão P13 real (≥3 botijões de marcas diferentes): Ø corpo, altura, **Ø externo e espessura do anel de
      base**, altura do anel, planicidade da borda do anel, tara gravada.
- [ ] Altura do CG do botijão cheio (método: tombamento controlado ou cálculo com nível de líquido).
- [ ] Sensor meia ponte do kit: L × W × H, ressalto (Ø, altura), posição da lingueta, deflexão na carga nominal,
      etiqueta de capacidade, esquema de cores.
- [ ] Célula single-point: datasheet (capacidade, sobrecarga segura/ruptura, tamanho máximo de plataforma, erro
      de canto, furação, torque).
- [ ] ESP32-C3, HX711, carregador, buck-boost, 18650, breakout USB-C: dimensões reais.
- [ ] Pés: altura sob carga, dureza, atrito no piso típico (cerâmica, cimento queimado, molhado).

## 2. Revisão geométrica (rodar `scripts/run_all.sh` depois de cada medição)

- [ ] `validation/interferencias_A.md` e `_B.md`: zero interferências.
- [ ] Menor folga lado pesado × lado solo = folga do batente; o resto > folga do batente + 0,2 mm.
- [ ] Anel do botijão inteiramente sobre a placa superior (não só na tampa impressa).
- [ ] Altura total dentro da faixa decidida.
- [ ] Ângulo de tombamento ≥ o do botijão direto no chão (ou risco aceito explicitamente).

## 3. Ensaios de bancada (massas de referência, sem botijão)

- [ ] Linearidade 0–35 kg em degraus de 5 kg (carregando e descarregando — histerese).
- [ ] Erro de canto: mesma massa em 5 posições (centro + 4 deslocadas 25 mm e 50 mm).
- [ ] Repetibilidade: 10 ciclos de colocar/retirar a mesma massa.
- [ ] Deflexão real do sensor/célula + placa na borda (relógio comparador) → ajustar `gap_stop`.
- [ ] Batente encosta antes de qualquer outra peça (lâmina de 1 mm passa no labirinto com 100 kg).
- [ ] Sobrecarga de 100 kg em pé sobre a borda: sem dano permanente, zero volta ao valor.
- [ ] Queda controlada (fator de impacto): massa de 30 kg baixada de 2–3 cm; medir pico.
- [ ] Deriva (creep) 24 h com 30 kg; deriva térmica 15–40 °C.
- [ ] Puxar/empurrar o cabo USB-C com massa sobre a plataforma: leitura não muda.

## 4. Estabilidade (com massa de forma equivalente ao botijão, depois botijão vazio)

- [ ] Ângulo de tombamento em plano inclinável.
- [ ] Deslizamento dos pés em piso molhado.
- [ ] Empurrão lateral típico (perna, vassoura).

## 5. Elétrica / bateria

- [ ] Célula com proteção (sobrecarga, sobredescarga, curto) e power path validados em bancada.
- [ ] Temperatura do carregador e da bateria em recarga dentro do compartimento fechado.
- [ ] Consumo médio e autonomia real.
- [ ] Alcance Wi-Fi/BLE com placas de alumínio montadas (antena junto à parede plástica).

## 6. Liberação para botijão cheio

- [ ] Todos os itens 1–5 concluídos e revisados por segunda pessoa.
- [ ] Avaliação de segurança por profissional habilitado para o ambiente de uso de GLP.
