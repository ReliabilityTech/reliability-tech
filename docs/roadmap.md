# Roadmap

Ordem sugerida de trabalho a partir da fundação. As fases 0 e 1 são **bloqueantes**: quase todo
o resto depende delas.

## Fase 0 — Desbloquear (precisa de ação humana)

| # | Tarefa | Status |
| - | ------ | -------------------- |
| 0.1 | Importar RFs e RNFs do Notion para `docs/requisitos/` | ✅ Concluído em 2026-08-29 |
| 0.2 | Extrair tokens do protótipo do Stitch para `globals.css` | ✅ Concluído em 2026-08-30 — cor de marca (`#26734D`); ver [design-system.md](design-system.md) |
| 0.3 | Responder às perguntas do [ADR 0004](adr/0004-autenticacao-e-papeis.md) — papéis e multi-tenancy | ✅ Concluído em 2026-08-29 — ver ADR 0004 e [ADR 0006](adr/0006-estrategia-multi-tenancy.md). SSO/MFA/retenção de auditoria seguem em aberto, não bloqueiam a Fase 1 |
| 0.4 | Confirmar hospedagem e restrições de conformidade (LGPD) | Hospedagem decidida em 2026-09-07 — Fly.io, região `gru` (ver [deploy.md](deploy.md) e roadmap 5.1 a 5.3). Restrições de conformidade LGPD seguem em aberto — RNF-009 (SLA) e RNF-011 (RTO/RPO) continuam bloqueados por isso |

## Fase 1 — Domínio

| # | Tarefa | Status |
| - | ------ | ------ |
| 1.1 | Modelar as entidades de negócio em `schema.prisma` | ✅ Concluído em 2026-08-29 — 21 modelos cobrindo RF-001 a RF-029 |
| 1.2 | Escrever os schemas de domínio em `@arbora/contracts` | ✅ Concluído em 2026-08-29 |
| 1.3 | Gerar a primeira migração e um seed representativo | ✅ Concluído em 2026-08-29 — migração `20260829190237_dominio_arbora` |
| 1.4 | Preencher `docs/requisitos/glossario.md` | ✅ Concluído em 2026-08-29 |

## Fase 2 — Autenticação e autorização

| # | Tarefa | Status |
| - | ------ | ------ |
| 2.1 | Hash de senha com Argon2id (substituir o placeholder do seed) | ✅ Concluído em 2026-08-29 |
| 2.2 | `POST /auth/login` e `POST /auth/refresh` com JWT de vida curta | ✅ Concluído em 2026-08-29 — tokens em cookies httpOnly, refresh com rotação |
| 2.3 | `AuthGuard` e `RolesGuard` (`@Roles('admin')`) | ✅ Concluído em 2026-08-29 — globais via `APP_GUARD`, `@Public()` para rotas isentas |
| 2.4 | Sessão no front: rotas protegidas e middleware do Next | ✅ Concluído em 2026-08-29 — `/login`, `middleware.ts`, testado no navegador |
| 2.5 | Interceptor que grava em `AuditLog` | ✅ Concluído em 2026-08-29 — `@Audit(action, entity)`, aplicado a login/logout |

RF-003 (recuperação de senha por e-mail/SMS) não foi implementado nesta fase — depende de um
provedor de e-mail/SMS ainda não escolhido. SSO, MFA e retenção de auditoria seguem em aberto (ver
ADR 0004). Outras dívidas na tabela ao final deste documento.

## Fase 3 — Telas do protótipo

| # | Tarefa | Status |
| - | ------ | ------ |
| 3.1 | Implementar as telas do Stitch, substituindo a página provisória | ✅ Concluído em 2026-08-31 — 10 telas em `apps/web/src/app/(app)/`, ver [design-system.md](design-system.md) |
| 3.2 | Camada de dados no front (TanStack Query ou Server Components + cache) | ✅ Concluído em 2026-08-31 — endpoints de domínio na API (`AlunosModule`, `ProfessorModule`, `RecadosModule`, `EventosModule`, `TenantsModule`, `ResponsavelModule`, `DashboardModule`) e as 10 telas lendo/escrevendo dado real via Server Components + `apiFetch`/`serverFetch` |
| 3.3 | Formulários com validação a partir dos schemas de `@arbora/contracts` | ✅ Concluído em 2026-09-05 — `criarRecadoRequestSchema`, `criarEventoRequestSchema` e `lancarNotaRequestSchema` validados no client antes do envio (`safeParse` + `primeiroErroPorCampo`), com mensagens em pt-BR nos próprios schemas |
| 3.4 | Estados de carregamento, vazio e erro em todas as listagens | ✅ Concluído em 2026-09-05 — `loading.tsx` por rota (esqueletos em `components/skeleton.tsx`), `error.tsx` único em `(app)/` com "Tentar novamente", mensagens de "nenhum X ainda" nas listagens que podiam vir vazias |
| 3.5 | Revisão de acessibilidade (checklist em `docs/design-system.md`) | ✅ Concluído em 2026-09-05 — contraste AA/AAA auditado e corrigido, rótulos e `aria-label` em todo campo, `role="alert"` nos erros de formulário, mais um seletor de tema (claro/escuro/alto contraste) que não estava no escopo original — ver [design-system.md](design-system.md#acessibilidade) |

## Fase 4 — Qualidade

| # | Tarefa | Status |
| - | ------ | ------ |
| 4.1 | Testes E2E com Playwright (Chromium já está no ambiente) | ✅ Concluído em 2026-09-05 — `apps/web/e2e/` cobre login, dashboard/alunos/comunicados do admin, lançamento de notas e chamada do professor, e o painel do super-admin, autenticados via `storageState` por papel; `pnpm --filter @arbora/web test:e2e` reseta e resemeia o banco antes da suíte. A depuração revelou e corrigiu 3 bugs reais: `keepAliveTimeout`/`headersTimeout` do Nest não configurados (`fetch failed`/ECONNRESET esporádico em Server Components sob idle — `apps/api/src/main.ts`), timeout curto demais para o primeiro login após boot a frio do `next dev` (`apps/web/e2e/auth.setup.ts`), e um bug de teste (`page.waitForURL` não reancora em transições client-side do App Router; trocado por `expect(page).toHaveURL`) |
| 4.2 | Testes de integração da API com banco efêmero (Testcontainers) | ✅ Concluído em 2026-09-05 — `apps/api/test/integration/` sobe um Postgres efêmero (`@testcontainers/postgresql`) uma vez por run (`globalSetup`/`globalTeardown` em `jest.integration.config.js`), roda `prisma migrate deploy` de verdade contra ele e monta um `INestApplication` real (`AppModule` inteiro, sem mock de `PrismaService`). Primeiro teste (`tenant-isolation.integration-spec.ts`) cobre exatamente a lacuna que a ADR 0006 aponta: sem RLS configurado ainda, o isolamento entre tenants depende só da disciplina de `where: { tenantId }` no código — um teste unitário com Prisma mockado não pegaria uma query que esqueceu esse filtro, porque o mock devolve o que mandarmos; só um teste contra dado real de dois tenants sobrepostos pega esse vazamento. Roda via `pnpm --filter @arbora/api test:integration`, fora do `pnpm check` (precisa de Docker) |
| 4.3 | Limite mínimo de cobertura no CI | ✅ Concluído em 2026-09-07 — `coverageThreshold` no jest da API (`apps/api/package.json`) e `thresholds` no vitest de contracts/web (`packages/contracts/vitest.config.ts`, `apps/web/vitest.config.ts`), todos com o piso ajustado pro valor medido hoje (não uma meta aspiracional): trava regressão sem exigir teste novo só pra bater número. Novo script `pnpm test:coverage` (`turbo run test -- --coverage`) substitui `pnpm test` dentro de `pnpm check` e do CI (`.github/workflows/ci.yml`) |
| 4.4 | Preencher `docs/requisitos/rastreabilidade.md` | ✅ Concluído em 2026-09-07 — matriz completa RF-001 a RF-029 e RNF-001 a RNF-019, cruzando requisito × implementação (arquivo/endpoint real, não só schema) × teste × status, levantada lendo o código atual (não copiada do status desatualizado dos próprios `funcionais.md`/`nao-funcionais.md`). Achado principal: vários RFs de comunicação/movimentação (RF-016 a RF-023 exceto RF-015) têm modelo Prisma completo mas nenhum controller os expõe — "modelado" não é "implementado". Também corrigiu 4 status desatualizados em `nao-funcionais.md` (RNF-003, RNF-004, RNF-012, RNF-013, RNF-018) que ainda descreviam um estado anterior a fases já concluídas |
| 4.5 | Testes de componente no front (Vitest + Testing Library) | ✅ Concluído em 2026-09-07 — `@testing-library/react`/`jest-dom`/`user-event` + `jsdom` (`apps/web/vitest.config.ts`: `environment: 'jsdom'`, `@vitejs/plugin-react` pro JSX automatic runtime, alias `@/*` espelhando o tsconfig, `afterEach(cleanup)` em `vitest.setup.ts`). 6 componentes com lógica de verdade testados: `ThemeToggle`, `error.tsx` (o boundary único de `(app)/`), `NotasForm`, `NovoRecadoDialog`, `NovoEventoDialog` (com teste de regressão pro parse de data em meio-dia local — RF-025) e `ChamadaList`. Cobertura de `apps/web` agora inclui `src/components/**` e os arquivos `*-{client,dialog,form,list}.tsx`/`error.tsx` de `src/app` (convenção de nome do projeto pra componente client-side com lógica), piso subiu de 15%/50%/30%/15% pra 50%/80%/65%/50%. Achados no processo: o `<input required>` nativo bloqueia o submit antes do handler React rodar (mesma lição da Fase 4.1, contornado com `fireEvent.submit` direto no form pra testar o guard manual como defesa em profundidade); e instrumentação de cobertura (V8) sozinha já deixa `userEvent` real-timer instável o suficiente pra interleaving de digitação entre testes — resolvido com `delay: null` em todo `userEvent.setup()` |

## Fase 5 — Operação

| # | Tarefa | Status |
| - | ------ | ------ |
| 5.1 | Dockerfile de produção para API e web (o Next já gera `standalone`) | ✅ Concluído em 2026-09-07 — `apps/api/Dockerfile` e `apps/web/Dockerfile`, multi-stage com `turbo prune --docker` (isola só o que cada app precisa antes de instalar) + `pnpm install --frozen-lockfile` + build. Web usa a saída `standalone` do Next (copia só `.next/standalone` + `.next/static`, ~344MB); API sobe com devDependencies incluídas (~1.08GB) — `pnpm prune --prod` corrompe os symlinks do pnpm contra o lockfile já reduzido pelo turbo prune (o pacote fica no `.pnpm` store, o link em `node_modules` some, "Cannot find module" em runtime), então foi abandonado em favor de uma imagem maior mas correta; otimizar o tamanho fica pra depois. `NEXT_PUBLIC_*` entra como `ARG` (inlinado no bundle em build time, não lido em runtime) — precisa de valor default explícito no Dockerfile, não só o fallback de `env.ts`, porque um `ARG` sem `--build-arg` vira string vazia, não `undefined`, e `??` não cai no fallback pra string vazia. Testado de ponta a ponta: `docker build` + container rodando contra o Postgres real (`arbora_default`), `/api/v1/health` responde `ok` e `/login` renderiza | 
| 5.2 | Pipeline de deploy com `prisma migrate deploy` | ✅ Concluído em 2026-09-07, revisado depois que a 5.3 decidiu Fly.io — `.github/workflows/deploy.yml` builda e publica `apps/api`/`apps/web` no GHCR, depois `flyctl deploy` os dois apps do ambiente escolhido. A migração **não** é um job à parte: roda via `release_command` do `fly.toml` (mecanismo nativo do Fly — máquina nova, imagem nova, antes de trocar o tráfego), usando o `DATABASE_URL` que `fly postgres attach` já grava como secret na app. Disparo é manual (`workflow_dispatch`, escolhe `staging`/`production`) |
| 5.3 | Ambientes de staging e produção com segredos gerenciados | ✅ Concluído em 2026-09-07 — Fly.io (roadmap 0.4), região `gru`. `apps/api/fly.toml`/`fly.staging.toml` e `apps/web/fly.toml`/`fly.staging.toml` descrevem os 4 apps (produção fica com 1 máquina sempre ligada, staging escala a zero); 2 clusters de Postgres separados (`fly postgres attach` grava `DATABASE_URL` direto na app de API, sem duplicar credencial no repo nem no GitHub); `JWT_SECRET` e `CORS_ORIGINS` via `fly secrets set`, um valor por ambiente. `docs/deploy.md` tem o passo a passo completo. **Não validado contra uma conta Fly real** — a sessão que escreveu isso não tinha credencial pra testar; seguir o passo 5 do doc (deploy manual) antes de confiar no pipeline automatizado |
| 5.4 | Monitoramento de erros (Sentry ou equivalente) e alertas sobre `/health` | Pendente |
| 5.5 | Backup automatizado do PostgreSQL, com restauração testada | Pendente |
| 5.6 | Renovação automática de dependências (Dependabot ou Renovate) | Pendente |

## Dívidas técnicas conhecidas

Registradas aqui de forma consciente, não esquecidas:

| Item | Onde | Por que existe |
| ---- | ---- | -------------- |
| RLS por `tenant_id` não configurado no Postgres | banco (ver ADR 0006) | Isolamento entre tenants depende só da aplicação por enquanto |
| Sem cache remoto do Turborepo | `turbo.json` | Só compensa com o time maior; hoje o cache é local |
| Imagem Docker da API inclui devDependencies (~1.08GB) | `apps/api/Dockerfile` | `pnpm prune --prod` corrompe os symlinks do pnpm contra o lockfile reduzido pelo `turbo prune` — corrigir isso é otimização de tamanho, não bug funcional |
| `middleware.ts` chama a API a cada navegação | `apps/web/src/middleware.ts` | Simples e correto; otimizar (JWT local) se a latência incomodar |
| Sem refresh silencioso no front | `apps/web/src/lib/auth.ts` | Access token expirado em uso só é pego na próxima navegação, via redirect — mutações client-side (`apiFetch`) podem falhar com 401 se o access token expirar no meio da sessão |
| Seed não é idempotente para `Recado`, `Evento`, `Ocorrencia` e `Movimentacao` | `apps/api/prisma/seed.ts` | Usam `create` em vez de `upsert` (sem chave natural óbvia); rodar `db:seed` mais de uma vez duplica essas linhas — truncar as tabelas antes de re-semear |
