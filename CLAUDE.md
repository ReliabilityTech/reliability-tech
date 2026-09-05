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

A fundação está pronta, o domínio está modelado, a autenticação está implementada, e as 10 telas
do protótipo do Stitch foram reproduzidas, ligadas a dado real, com validação client-side,
estados de carregamento/vazio/erro e revisão de acessibilidade — **Fase 3 completa** (Fases 0 a
3.5 do roadmap): RFs/RNFs importados (`docs/requisitos/`), papéis e estratégia de multi-tenancy
decididos (ADR 0004 e ADR 0006), entidades em `schema.prisma` e schemas espelhados em
`@arbora/contracts` (schemas 1:1 em `academico.ts`/`comunicacao.ts`/`agenda.ts`/`tenant.ts`,
vistas compostas por tela em `views.ts`), login/refresh/logout via JWT em cookies httpOnly
(`apps/api/src/auth/`), `AuthGuard`/`RolesGuard` globais, sessão protegida no front
(`apps/web/src/middleware.ts`), interceptor de auditoria em `AuditLog` (com `tenantId`
propagado), e as telas em `apps/web/src/app/(app)/` com a paleta e tipografia reais do protótipo
(ver `docs/design-system.md`) ligadas aos endpoints de domínio da API (`AlunosModule`,
`ProfessorModule`, `RecadosModule`, `EventosModule`, `TenantsModule`, `ResponsavelModule`,
`DashboardModule`) via Server Components (`apps/web/src/lib/server-api.ts`) e mutações client-side
(`apps/web/src/lib/*-client.ts`) que validam o payload contra o schema do `@arbora/contracts`
antes de qualquer chamada de rede (`apps/web/src/lib/form-errors.ts`). Cada rota tem seu
`loading.tsx` (esqueletos em `apps/web/src/components/skeleton.tsx`) e um `error.tsx` único em
`(app)/` cobre falhas de rede/API de qualquer página com "Tentar novamente". Contraste
AA/AAA auditado e corrigido por tema, todo campo com rótulo/`aria-label`, erros de formulário
com `role="alert"`, e um seletor de tema claro/escuro/alto contraste (`ThemeToggle`,
`data-theme` em `<html>`) — ver `docs/design-system.md#acessibilidade`.

Antes de mexer no domínio, leia:

- `docs/requisitos/funcionais.md` e `docs/requisitos/nao-funcionais.md` — RF-NNN/RNF-NNN, fonte
  de verdade dos requisitos (não duplicar o conteúdo deles aqui)
- `docs/requisitos/glossario.md` — nome de cada entidade/papel, em português, sem sinônimo
- `docs/adr/0004-autenticacao-e-papeis.md` — papéis (`SUPER_ADMIN`, `ADMIN_ESCOLAR`,
  `COORDENACAO`, `PROFESSOR`, `RESPONSAVEL`); SSO, MFA e retenção de auditoria seguem em aberto
- `docs/adr/0006-estrategia-multi-tenancy.md` — banco compartilhado, discriminador `tenant_id`
  obrigatório em toda tabela de escola; RLS no Postgres (segunda camada) **ainda não configurado**
  — ver dívida aberta em `docs/roadmap.md` Fase 1
- `docs/roadmap.md` — ordem sugerida de trabalho

Se uma tarefa depender de um requisito que não está em `docs/requisitos/`, **pergunte antes de
inventar** — e registre a hipótese em um ADR se precisar seguir mesmo assim.

## Documentação

`docs/arquitetura.md`, `docs/convencoes.md`, `docs/design-system.md`, `docs/adr/`.
