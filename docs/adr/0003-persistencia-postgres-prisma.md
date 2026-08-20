# ADR 0003 — PostgreSQL como banco principal, acessado via Prisma

- **Status:** Aceito
- **Data:** 2026-08-20

## Contexto

Ainda não conhecemos o modelo de domínio do Arbora, mas conhecemos as características prováveis:
dados relacionais, necessidade de integridade referencial, consultas analíticas e trilha de
auditoria. Também precisamos evoluir o schema com frequência nas primeiras semanas.

## Decisão

**PostgreSQL 17** como banco principal, acessado pelo **Prisma ORM**, com migrações versionadas
no repositório (`apps/api/prisma/migrations/`).

## Alternativas consideradas

| Alternativa | Por que foi descartada |
| ----------- | ---------------------- |
| MongoDB | Sem restrições de integridade no banco; o custo aparece quando o domínio relacional amadurece. |
| TypeORM | Histórico de instabilidade em migrações e tipagem mais fraca que a do Prisma. |
| SQL puro (Kysely, pg) | Controle total, mas sem ferramenta de migração integrada nem tipos derivados do schema. |

## Consequências

**Positivas:**

- Tipos do cliente são gerados a partir do schema: uma coluna renomeada quebra o build, não a
  produção.
- `prisma migrate` dá histórico de schema versionado e reprodutível.
- PostgreSQL cobre JSONB, full-text search e extensões sem trocar de banco.

**Negativas / custos aceitos:**

- `prisma generate` é um passo obrigatório antes do build (resolvido por um `postinstall`).
- Consultas muito específicas podem exigir `$queryRaw`, saindo da tipagem.

**Quando revisitar:** se aparecer necessidade de séries temporais em alto volume — nesse caso,
avaliar TimescaleDB (extensão do próprio PostgreSQL) antes de trocar de tecnologia.
