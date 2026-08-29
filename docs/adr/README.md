# Architecture Decision Records

Registro das decisões arquiteturais do Arbora: **o que** foi decidido, **por quê**, e quais
alternativas foram descartadas. Serve para que ninguém precise arqueologia de commits para
entender uma escolha — e para que revertê-la seja uma decisão consciente.

Use o [template](0000-template.md) para novos ADRs. Numere sequencialmente. Um ADR aceito não é
editado: se a decisão mudar, crie um novo que o substitua e marque o antigo como `Substituído`.

| #    | Decisão                                                        | Status |
| ---- | -------------------------------------------------------------- | ------ |
| 0001 | [Monorepo com pnpm e Turborepo](0001-monorepo-pnpm-turborepo.md) | Aceito |
| 0002 | [Next.js no front e NestJS na API](0002-stack-nextjs-nestjs.md)  | Aceito |
| 0003 | [PostgreSQL com Prisma](0003-persistencia-postgres-prisma.md)    | Aceito |
| 0004 | [Autenticação e papéis](0004-autenticacao-e-papeis.md)           | Aceito (SSO/MFA/retenção em aberto) |
| 0005 | [Contratos compartilhados com Zod](0005-contratos-compartilhados-zod.md) | Aceito |
| 0006 | [Estratégia de multi-tenancy](0006-estrategia-multi-tenancy.md) | Aceito |
