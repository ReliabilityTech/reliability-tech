# ADR 0005 — Contratos compartilhados com Zod em `@arbora/contracts`

- **Status:** Aceito
- **Data:** 2026-08-20

## Contexto

Front e API precisam concordar sobre o formato dos dados. Tipos TypeScript compartilhados
resolvem metade do problema — eles desaparecem em tempo de execução e não validam nada. Validação
duplicada (uma no front, outra na API) resolve a outra metade, mas as duas cópias divergem com o
tempo.

## Decisão

Um pacote `@arbora/contracts` define **schemas Zod**, dos quais os tipos TypeScript são
derivados com `z.infer`. O mesmo schema é usado:

- na API, pelo `ZodValidationPipe`, para validar a entrada;
- no front, pelo `apiFetch`, para validar a resposta;
- nos dois lados, como tipo estático.

O envelope de erro (`ApiError`) e a paginação também vivem lá, para que erro e listagem tenham
um formato único em todo o produto.

## Alternativas consideradas

| Alternativa | Por que foi descartada |
| ----------- | ---------------------- |
| `class-validator` + DTOs (padrão NestJS) | Funciona bem na API, mas as classes não são reaproveitáveis no front sem arrastar `reflect-metadata` para o bundle. |
| Geração de cliente a partir do OpenAPI | Gera tipos, não validação em tempo de execução, e adiciona um passo de codegen ao fluxo. |
| tRPC | Excelente tipagem ponta a ponta, mas acopla o cliente ao servidor TypeScript — inviabiliza consumidores externos da API. |
| Só tipos TypeScript compartilhados | Nenhuma garantia em tempo de execução: dado inválido atravessa a fronteira silenciosamente. |

## Consequências

**Positivas:**

- Uma mudança de contrato quebra o build de quem não se adaptou — no CI, não em produção.
- Mensagens de validação em pt-BR são escritas uma vez e aparecem nos dois lados.
- A resposta da API é validada no front: divergência de contrato vira erro explícito.

**Negativas / custos aceitos:**

- Zod entra no bundle do front (~13 kB gzip).
- Validar a resposta tem custo de CPU; aceitável para os volumes previstos, e desativável por
  endpoint se algum vier a ser crítico.
- `@arbora/contracts` precisa ser compilado antes de web e API (o Turborepo cuida disso via
  `dependsOn: ["^build"]`).

**Quando revisitar:** se o custo de validação aparecer em profiling de um endpoint de alto
volume.
