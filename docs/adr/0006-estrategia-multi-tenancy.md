# ADR 0006 — Multi-tenancy com banco compartilhado e discriminador `tenant_id`

- **Status:** Aceito
- **Data:** 2026-08-29
- **Decisores:** Victor Tavares Rafael

## Contexto

RF-006 a RF-008 confirmam que o Arbora é multi-tenant: cada escola é um tenant isolado, e um
super-admin gerencia o ciclo de vida de todos os tenants (ativação, suspensão, planos). RNF-003
exige isolamento rígido entre tenants; RNF-006 deixa em aberto qual arquitetura usar, condicionado
ao volume esperado de escolas — que ainda não foi dimensionado (ver perguntas em
`docs/requisitos/nao-funcionais.md`).

O ADR 0004 já apontava esta escolha como a mais cara de reverter depois, por mudar o
`schema.prisma` inteiro. Por isso ela precisa estar decidida antes da Fase 1 (modelagem de
domínio) do [roadmap](../roadmap.md).

## Decisão

Um único banco PostgreSQL, um único schema, com coluna `tenant_id` obrigatória em toda tabela que
guarda dado de escola. Duas camadas de proteção contra vazamento entre tenants:

1. **Aplicação:** todo acesso a dado de tenant passa por um `PrismaService`/middleware que injeta
   `tenant_id` a partir do contexto autenticado — nenhuma query de negócio pode omitir esse filtro.
2. **Banco:** Row-Level Security (RLS) do PostgreSQL como segunda barreira, caso a camada de
   aplicação falhe.

O super-admin (RF-008) opera fora desse filtro, em rotas próprias com seu próprio controle de
acesso — não herda `tenant_id` de contexto nenhum.

## Alternativas consideradas

| Alternativa | Por que foi descartada (por ora) |
| ----------- | --------------------------------- |
| Schema Postgres separado por tenant | Migração precisa rodar em N schemas a cada deploy; Prisma Client não suporta schema dinâmico por request de forma nativa — exigiria tooling extra. Isolamento maior do que o volume atual de escolas justifica. |
| Banco separado por tenant | Isolamento máximo, mas custo operacional (N conexões, N backups, N migrações) só compensa com poucos tenants grandes ou exigência contratual/legal de isolamento físico — nenhuma das duas confirmada nos requisitos. |

## Consequências

**Positivas:**

- Uma única migração por deploy; `pnpm --filter @arbora/api db:generate` continua simples.
- Custo de infraestrutura baixo desde o primeiro tenant.
- Consultas cross-tenant do super-admin (RF-008, RF-028 agregados) são simples — mesmo schema.

**Negativas / custos aceitos:**

- Isolamento depende de disciplina de código (toda query com `tenant_id`) — mitigado por RLS como
  segunda camada, mas RLS precisa ser configurado e testado por tabela.
- Um tenant com volume desproporcional de dados pode afetar performance de outros (sem isolamento
  de recursos por banco). Aceitável até haver dado real de volume.
- Testes automatizados de isolamento entre tenants (RNF-003) passam a ser obrigatórios, não
  opcionais — um vazamento aqui é o pior cenário de LGPD do produto.

**Quando revisitar:** se um tenant específico exigir isolamento físico contratual/legal, ou se o
volume de dados de um tenant começar a degradar os demais — migrar esse tenant para banco
dedicado é possível de forma incremental sem afetar os demais.
