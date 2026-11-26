# Relatório automático de verificação geométrica — Arquitetura A

> Gerado por `scripts/create_architecture_a.py` (`scripts/checks.py`). Não editar à mão: rode o script de novo.

## Arquitetura A

Cadeia de alturas: floor=0.0, foot_top=5.0, tray_bot=3.0, bp_bot=5.0, bp_top=8.0, sup_top=22.0, sens_top=30.0, tp_bot=31.0, tp_top=34.0, top=36.5, comp_top=28.5

Altura total da plataforma: **36.5 mm** (meta preliminar 30-45 mm)

### 1. Interferências (volume comum > 0.01 mm³)

- Nenhuma interferência entre 43 peças sólidas (cabos ilustrativos excluídos).

### 2. Caminho de carga (lado pesado × lado solo)

- Menor folga: **0.80 mm** entre `Placa_Superior` e `Batente_1`.
- OK: nenhum desvio de força (force shunt) em repouso.
- Menor folga sem contar os batentes: **1.50 mm** (`Tampa_Superior` × `Base_Inferior`). Precisa ser maior que a folga do batente (0.80 mm) para que, em sobrecarga, o batente encoste antes de qualquer outra peça. OK.

### 3. Sensores fazendo a ponte

- `Sensor_1`: distância ao lado pesado 0.000 mm, ao lado solo 0.000 mm (OK: toca os dois)
- `Sensor_2`: distância ao lado pesado 0.000 mm, ao lado solo 0.000 mm (OK: toca os dois)
- `Sensor_3`: distância ao lado pesado 0.000 mm, ao lado solo 0.000 mm (OK: toca os dois)
- `Sensor_4`: distância ao lado pesado 0.000 mm, ao lado solo 0.000 mm (OK: toca os dois)

### 4. Botijão de referência

- Distância botijão → tampa superior: 0.000 mm (apoio).
- Menor distância botijão → lado solo: 8.00 mm (`Compartimento`). OK
- Anel de base do botijão (Ø310, PENDENTE) dentro do diâmetro útil da tampa (Ø392): OK
- Raio dos sensores 150 mm × raio médio do anel 153.5 mm: diferença 3.5 mm (quanto menor, menor a flexão da placa superior).

### 5. Estabilidade ao tombamento (estática, simplificada)

- Botijão cheio estimado: 28.0 kg (tara PENDENTE 15.0 kg + GLP 13.0 kg) → 275 N.
- CG do conjunto a 266 mm do chão (CG do botijão PENDENTE: 230 mm + plataforma 36.5 mm).
- Botijão direto no chão: braço 155 mm → tomba a **34.0°**.
- Sobre a plataforma, polígono de 8 pés em r=180 mm: braço mínimo 166 mm → tomba a **32.0°**.
- Antes disso, a placa superior pode *bascular sobre os sensores*: braço mínimo 106 mm → 21.7°. Acima desse ângulo a placa levanta de 2 sensores e se apoia nos batentes (leitura inválida, mas sem queda se a placa estiver retida lateralmente).
- Leitura: a plataforma **reduz** o ângulo de tombamento em relação ao botijão direto no chão. Cálculo estático; não considera piso inclinado, empurrão dinâmico ou deslizamento — validar em ensaio.
