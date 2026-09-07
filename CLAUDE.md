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

**Fase 4 (Qualidade) completa**: `apps/web/e2e/` cobre login, as telas do admin, o lançamento de
notas/chamada do professor e o painel do super-admin via Playwright, autenticados via
`storageState` por papel (`pnpm --filter @arbora/web test:e2e`, 4.1). `apps/api/test/integration/`
sobe um Postgres efêmero de verdade via Testcontainers, roda as migrações reais e testa isolamento
entre tenants sem mockar o Prisma (`pnpm --filter @arbora/api test:integration`, 4.2). `pnpm
check`/CI rodam `pnpm test:coverage`, com piso de cobertura no jest da API e no vitest de
contracts/web — web mede `src/lib/**`, `src/components/**` e os arquivos
`*-{client,dialog,form,list}.tsx`/`error.tsx` de `src/app` (4.3). `docs/requisitos/rastreabilidade.md`
cruza cada RF/RNF com o código e teste reais — vários requisitos de comunicação/movimentação têm
modelo no schema mas nenhum endpoint que o exponha, ver o documento antes de assumir que um RF
está pronto (4.4). Componentes com lógica real (`ThemeToggle`, `error.tsx`, `NotasForm`,
`NovoRecadoDialog`, `NovoEventoDialog`, `ChamadaList`) têm teste via Vitest + Testing Library,
ambiente `jsdom` configurado em `apps/web/vitest.config.ts`/`vitest.setup.ts` (4.5).

RF-007 (cadastro de instituição) e RF-009 (cadastro de turma/disciplina/aluno/professor) também
saíram do "só existe via seed" que a matriz de rastreabilidade apontou: `apps/api/src/tenants/`,
`turmas/`, `disciplinas/`, `usuarios/` e `alunos/` agora têm `POST` de verdade, com tela própria em
`apps/web/src/app/(app)/`. Vincular responsável ao aluno no cadastro (RF-004) e atribuir professor
a turma+disciplina continuam pendentes — ver `docs/requisitos/rastreabilidade.md`.

**Fase 5.1 (Dockerfile de produção) concluída**: `apps/api/Dockerfile` e `apps/web/Dockerfile`,
multi-stage com `turbo prune --docker`, testados de ponta a ponta contra o Postgres real. Hospedagem
(roadmap 0.4) decidida: Fly.io, região `gru` (São Paulo). Fase 5.2 (pipeline de deploy) e 5.3
(ambientes com segredos gerenciados) saem juntas: `.github/workflows/deploy.yml` builda/publica as
imagens no GHCR e roda `flyctl deploy` pro ambiente escolhido (disparo manual, `workflow_dispatch`);
a migração roda via `release_command` do próprio `fly.toml` — mecanismo nativo do Fly, não um job à
parte — usando o `DATABASE_URL` que `fly postgres attach` já grava como secret na app, sem duplicar
credencial em lugar nenhum. `apps/api/fly.toml`/`fly.staging.toml` e `apps/web/fly.toml`/
`fly.staging.toml` descrevem os 4 apps (API/web × staging/produção); `docs/deploy.md` tem o passo a
passo de provisionamento — **não validado contra uma conta Fly real**, testar manualmente antes de
confiar no pipeline.

**Fase 5.4 (monitoramento) concluída**: `@sentry/nestjs` (`apps/api/src/instrument.ts`,
importado antes de tudo em `main.ts`) e `@sentry/nextjs` (`apps/web/src/instrumentation.ts` +
`sentry.{client,server,edge}.config.ts`) capturam erro em runtime, inativos sem
`SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` — filtro de captura só reporta 5xx/erro inesperado, igual à
disciplina já existente em `AllExceptionsFilter`/`error.tsx`. `SENTRY_AUTH_TOKEN` (permissão de
escrita) nunca é `ARG`/`ENV` de imagem — entra via BuildKit secret mount
(`apps/web/Dockerfile`), pra não vazar em `docker history`/cache do CI. Provisionamento e alerta
de uptime sobre `/health` em `docs/deploy.md`/`docs/monitoring.md` — **não validado contra conta
Sentry real**.

**Fase 5.5 (backup) concluída**: `.github/workflows/backup.yml` roda `pg_dump`
(`apps/api/scripts/backup-db.sh`) todo dia contra o Postgres de produção via `flyctl proxy`,
sobe o dump num bucket Tigris usando um papel Postgres dedicado só-leitura (nunca o
`DATABASE_URL` de escrita da API). `apps/api/scripts/restore-db.sh` faz o caminho inverso.
A mecânica de dump/restore tem teste automatizado contra Postgres real, não mock —
`apps/api/test/integration/backup-restore.integration-spec.ts` — provando "restauração
testada" de fato. `docs/backup.md` tem o provisionamento e o ensaio manual — **não validado
contra conta Fly/Tigris real**.

**Fase 5.6 (renovação de dependências) concluída, Fase 5 completa**: `.github/dependabot.yml` —
Dependabot (nativo do GitHub, sem app terceiro) cobre o workspace pnpm inteiro (um entry `npm`
detecta os workspaces a partir do `pnpm-lock.yaml` na raiz), as actions dos 3 workflows e a
imagem base dos dois Dockerfile. Minor/patch entram agrupados por categoria; major sempre isolado.
Abre PR, não faz merge sozinho — cada um passa pelo `pull_request` de `ci.yml` e espera revisão
humana.

**Fase 6 (lacunas restantes e evolução)** cobre três frentes independentes, ver
`docs/roadmap.md`: 6.1 lacunas funcionais restantes, 6.2 RLS no Postgres, 6.3 PWA + split de
monorepo (este último só quando o usuário confirmar que "as condições estão favoráveis" — não
começar sem pedido explícito). **Fase 6.1 está completa**: vínculo responsável↔aluno (RF-004) —
`POST`/`DELETE /alunos/:id/responsaveis` resolve por e-mail, reaproveitando uma conta
`RESPONSAVEL` existente do mesmo tenant em vez de duplicar (RF-004 cita "pai e mãe separados,
ambos com acesso"). Atribuição professor↔turma+disciplina — `apps/api/src/turma-disciplinas/`
(`POST /turma-disciplinas`, upsert por `[turmaId, disciplinaId]`), `usuarios.service.ts` ganha
`turmasAtribuidas`. Unitário/integração(Postgres real)/componente verificados verdes; o caso E2E
existe em `apps/web/e2e/admin.spec.ts` mas **não foi verificado rodando** nesta sessão — máquina
com CPU a 90%+/RAM livre baixa no momento, todas as falhas foram timeout de compilação/navegação,
nunca uma asserção quebrada.

**Fase 6.2 (RLS) concluída**: políticas RLS nas 8 tabelas com `tenant_id` obrigatório e direto
(`turmas`, `disciplinas`, `periodos_letivos`, `alunos`, `recados`, `conversas`, `eventos`,
`notificacoes` — ver ADR 0006). O papel de migração (`arbora`) é superusuário e ignora RLS
sempre — a API roda com um papel novo e restrito (`arbora_app`, `APP_DATABASE_URL`), separado do
de migração. Contexto de tenant flui via `AsyncLocalStorage`
(`apps/api/src/common/tenant-context.ts`) até uma extensão do Prisma Client
(`apps/api/src/prisma/tenant-rls.extension.ts`); `PrismaService` agora é composição, não herança
(`this.prisma.db.<model>`, não `this.prisma.<model>` — ~15 arquivos, mecânico). Provado contra
Postgres real: `apps/api/test/integration/row-level-security.integration-spec.ts`. Tabelas
"filhas" sem `tenant_id` próprio e `users`/`audit_logs` ficam de fora desta rodada
(`docs/roadmap.md`, dívida técnica). 6.3 (PWA+split) segue pendente, não iniciado.

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

`docs/arquitetura.md`, `docs/convencoes.md`, `docs/design-system.md`, `docs/adr/`, `docs/deploy.md`
(provisionamento Fly.io — staging e produção), `docs/monitoring.md` (Sentry e alerta de uptime),
`docs/backup.md` (backup e restauração do Postgres).
