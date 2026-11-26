# Conceito do produto

## O que é

Plataforma circular de pesagem colocada **sob** o botijão P13. Mede o peso total continuamente e estima o GLP
restante (`GLP = peso − tara − peso do lado pesado da plataforma`, com tara lida na alça do botijão). Envia por
Wi-Fi/BLE (ESP32-C3) para o app/backend.

## O que não é

- **Não** é detector de vazamento. Não substitui detector de gás nem inspeção da instalação.
- **Não** toca válvula, regulador, mangueira ou tubulação. Contato só com o anel de base (saia) do botijão.
- **Não** é balança legal/metrológica (sem homologação INMETRO). Mostra estimativa.

## Direção industrial (aplicada no modelo)

| Requisito | Como está no modelo v0.1 |
|---|---|
| Circular, perfil baixo | Ø400 × 36,5 mm (Arq. A) / 46,5 mm (Arq. B) |
| Grafite, fosco, texturizado | Tampa e base em PETG/ASA grafite; face superior impressa contra mesa PEI texturizada |
| Bordas suavizadas | Raio 4 mm na borda superior, 1,5 mm na inferior |
| Logotipo pequeno em baixo-relevo | "MedeGás" 11 mm, 0,4 mm de profundidade, na frente (lado do USB-C) |
| Sem display, botões ou LEDs visíveis | Nenhum. Estado só no app |
| USB-C lateral discreto, protegido, embutido | Receptáculo recuado ~2 mm numa moldura, com tampa de TPU rente à parede |
| "Quase invisível" | Única linha visível: a linha de sombra de 2 mm entre tampa (pesada) e base (solo) — que é também a separação funcional do caminho de carga |

## Princípio físico central: dois corpos e uma ponte

```
       botijão
          │ anel de base
   ┌──────▼──────────────────────────┐  TAMPA (impressa, lado PESADO)
   │══════ PLACA SUPERIOR (Al) ══════│  ← caminho estrutural
   └──────┬────────────────────┬─────┘
       sensor(es) = única ponte (+ batentes, só em sobrecarga)
   ┌──────┴────────────────────┴─────┐
   │══════ PLACA INFERIOR (Al) ══════│  BASE (impressa, lado SOLO)
   └──┬───────[eletrônica]───────┬───┘  ← bateria, ESP32, USB-C: tudo no lado solo
     pé                         pé
```

Qualquer contato entre lado pesado e lado solo fora do sensor **desvia força** e a leitura fica errada. O modelo
tem verificação automática disso (`scripts/checks.py`). Consequências de projeto:

- Eletrônica, bateria, cabos e USB-C ficam todos no lado solo: puxar o cabo de carga não altera a leitura.
- Folga mínima entre os dois lados (1,5 mm no labirinto) maior que a folga dos batentes (0,8 mm), para que em
  sobrecarga o batente metálico encoste antes de qualquer peça plástica.

## Arquiteturas em estudo

Duas, sem escolha feita — ver [comparacao-sensores.md](comparacao-sensores.md).
