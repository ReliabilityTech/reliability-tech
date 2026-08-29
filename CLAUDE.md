# Arbora — guia para agentes

Monorepo TypeScript: `apps/web` (Next.js 15), `apps/api` (NestJS 11), `packages/contracts`
(schemas Zod compartilhados). Gerenciado com pnpm workspaces + Turborepo.

## Comandos

```bash
pnpm install
pnpm dev                          # web :3000, API :3333
pnpm check                        # format + lint + typecheck + test (o mesmo que o CI)
pnpm --filter @arbora/api test    # testes de um pacote só
pnpm infra:up && pnpm db:migrate  # PostgreSQL local + schema
```

Depois de alterar `apps/api/prisma/schema.prisma`, rode `pnpm --filter @arbora/api db:generate`
antes do typecheck — os tipos do Prisma Client são gerados a partir do schema.

## Regras do projeto

- **Contrato antes de código.** Mudou o formato de um dado? Altere primeiro o schema em
  `packages/contracts/src/`, depois os dois lados. Nunca declare o mesmo tipo duas vezes.
- **Nenhum `process.env` solto.** Variáveis de ambiente passam por `apps/api/src/config/env.ts`
  ou `apps/web/src/lib/env.ts`.
- **Erros seguem o envelope `ApiError`.** O `AllExceptionsFilter` cuida disso; não devolva
  formatos próprios de erro.
- **Português no domínio, inglês no framework.** `OrdemDeServico`, mas `OrdemDeServicoService`.
- **Comente o porquê, não o quê.**
- **Toda mudança de comportamento vem com teste.** Jest na API, Vitest no restante.

## Estado do projeto

A fundação está pronta e o domínio de negócio (Fase 0 e 1 do roadmap) está modelado: RFs/RNFs
importados (`docs/requisitos/`), papéis e estratégia de multi-tenancy decididos (ADR 0004 e ADR
0006), entidades em `schema.prisma` e schemas espelhados em `@arbora/contracts`. **Autenticação
(login, guards, hash real de senha) ainda não está implementada** — é a Fase 2. O protótipo do
Stitch ainda não foi acessado, então telas e tokens de design seguem pendentes (Fase 3).

Antes de mexer no domínio, leia:

- `docs/requisitos/funcionais.md` e `docs/requisitos/nao-funcionais.md` — RF-NNN/RNF-NNN, fonte
  de verdade dos requisitos (não duplicar o conteúdo deles aqui)
- `docs/requisitos/glossario.md` — nome de cada entidade/papel, em português, sem sinônimo
- `docs/adr/0004-autenticacao-e-papeis.md` — papéis (`super_admin`, `admin_escolar`,
  `coordenacao`, `professor`, `responsavel`); SSO, MFA e retenção de auditoria seguem em aberto
- `docs/adr/0006-estrategia-multi-tenancy.md` — banco compartilhado, discriminador `tenant_id`
  obrigatório em toda tabela de escola; RLS no Postgres (segunda camada) **ainda não configurado**
  — ver dívida aberta em `docs/roadmap.md` Fase 1
- `docs/roadmap.md` — ordem sugerida de trabalho

Se uma tarefa depender de um requisito que não está em `docs/requisitos/`, **pergunte antes de
inventar** — e registre a hipótese em um ADR se precisar seguir mesmo assim.

## Documentação

`docs/arquitetura.md`, `docs/convencoes.md`, `docs/design-system.md`, `docs/adr/`.
