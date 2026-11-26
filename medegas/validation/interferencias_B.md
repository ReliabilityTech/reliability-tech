# Relatório automático de verificação geométrica — Arquitetura B

> Gerado por `scripts/create_architecture_b.py` (`scripts/checks.py`). Não editar à mão: rode o script de novo.

## Arquitetura B

Cadeia de alturas: floor=0.0, foot_top=5.0, tray_bot=3.0, bp_bot=5.0, bp_top=8.0, cell_bot=12.0, cell_top=34.0, adapt_top=38.0, tp_bot=38.0, tp_top=44.0, top=46.5, comp_top=28.5

Altura total da plataforma: **46.5 mm** (meta preliminar 30-45 mm) — **FORA da faixa preliminar**

### 1. Interferências (volume comum > 0.01 mm³)

- Nenhuma interferência entre 35 peças sólidas (cabos ilustrativos excluídos).

### 2. Caminho de carga (lado pesado × lado solo)

- Menor folga: **0.80 mm** entre `Placa_Superior` e `Batente_1`.
- OK: nenhum desvio de força (force shunt) em repouso.
- Menor folga sem contar os batentes: **1.50 mm** (`Tampa_Superior` × `Base_Inferior`). Precisa ser maior que a folga do batente (0.80 mm) para que, em sobrecarga, o batente encoste antes de qualquer outra peça. OK.

### 3. Sensores fazendo a ponte

- `Celula_SinglePoint`: distância ao lado pesado 0.000 mm, ao lado solo 0.000 mm (OK: toca os dois)

### 4. Botijão de referência

- Distância botijão → tampa superior: 0.000 mm (apoio).
- Menor distância botijão → lado solo: 15.98 mm (`Batente_4`). OK
- Anel de base do botijão (Ø310, PENDENTE) dentro do diâmetro útil da tampa (Ø392): OK

### 5. Estabilidade ao tombamento (estática, simplificada)

- Botijão cheio estimado: 28.0 kg (tara PENDENTE 15.0 kg + GLP 13.0 kg) → 275 N.
- CG do conjunto a 276 mm do chão (CG do botijão PENDENTE: 230 mm + plataforma 46.5 mm).
- Botijão direto no chão: braço 155 mm → tomba a **34.0°**.
- Sobre a plataforma, polígono de 8 pés em r=180 mm: braço mínimo 166 mm → tomba a **31.0°**.
- Leitura: a plataforma **reduz** o ângulo de tombamento em relação ao botijão direto no chão. Cálculo estático; não considera piso inclinado, empurrão dinâmico ou deslizamento — validar em ensaio.
