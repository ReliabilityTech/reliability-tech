# Roadmap

Ordem sugerida de trabalho a partir da fundação. As fases 0 e 1 são **bloqueantes**: quase todo
o resto depende delas.

## Fase 0 — Desbloquear (precisa de ação humana)

| # | Tarefa | Status |
| - | ------ | -------------------- |
| 0.1 | Importar RFs e RNFs do Notion para `docs/requisitos/` | ✅ Concluído em 2026-08-29 |
| 0.2 | Extrair tokens do protótipo do Stitch para `globals.css` | ✅ Concluído em 2026-08-30 — cor de marca (`#26734D`); ver [design-system.md](design-system.md) |
| 0.3 | Responder às perguntas do [ADR 0004](adr/0004-autenticacao-e-papeis.md) — papéis e multi-tenancy | ✅ Concluído em 2026-08-29 — ver ADR 0004 e [ADR 0006](adr/0006-estrategia-multi-tenancy.md). SSO/MFA/retenção de auditoria seguem em aberto, não bloqueiam a Fase 1 |
| 0.4 | Confirmar hospedagem e restrições de conformidade (LGPD) | Pendente — bloqueia RNF-009 (SLA) e RNF-011 (RTO/RPO), não bloqueia modelagem de domínio |

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
| 3.2 | Camada de dados no front (TanStack Query ou Server Components + cache) | Pendente — telas hoje usam array estático (mock), API não tem endpoints CRUD de domínio ainda |
| 3.3 | Formulários com validação a partir dos schemas de `@arbora/contracts` | Pendente — depende de 3.2 e dos endpoints de escrita na API |
| 3.4 | Estados de carregamento, vazio e erro em todas as listagens | Pendente — não faz sentido sem dado real (3.2) |
| 3.5 | Revisão de acessibilidade (checklist em `docs/design-system.md`) | Pendente |

## Fase 4 — Qualidade

| # | Tarefa |
| - | ------ |
| 4.1 | Testes E2E com Playwright (Chromium já está no ambiente) |
| 4.2 | Testes de integração da API com banco efêmero (Testcontainers) |
| 4.3 | Limite mínimo de cobertura no CI |
| 4.4 | Preencher `docs/requisitos/rastreabilidade.md` |
| 4.5 | Testes de componente no front (Vitest + Testing Library) |

## Fase 5 — Operação

| # | Tarefa |
| - | ------ |
| 5.1 | Dockerfile de produção para API e web (o Next já gera `standalone`) |
| 5.2 | Pipeline de deploy com `prisma migrate deploy` |
| 5.3 | Ambientes de staging e produção com segredos gerenciados |
| 5.4 | Monitoramento de erros (Sentry ou equivalente) e alertas sobre `/health` |
| 5.5 | Backup automatizado do PostgreSQL, com restauração testada |
| 5.6 | Renovação automática de dependências (Dependabot ou Renovate) |

## Dívidas técnicas conhecidas

Registradas aqui de forma consciente, não esquecidas:

| Item | Onde | Por que existe |
| ---- | ---- | -------------- |
| RLS por `tenant_id` não configurado no Postgres | banco (ver ADR 0006) | Isolamento entre tenants depende só da aplicação por enquanto |
| Sem cache remoto do Turborepo | `turbo.json` | Só compensa com o time maior; hoje o cache é local |
| Sem testes E2E | — | Depende de haver telas reais |
| `middleware.ts` chama a API a cada navegação | `apps/web/src/middleware.ts` | Simples e correto; otimizar (JWT local) se a latência incomodar |
| Sem refresh silencioso no front | `apps/web/src/lib/auth.ts` | Access token expirado em uso só é pego na próxima navegação, via redirect |
| Telas da Fase 3.1 usam dado mock, não a API | `apps/web/src/app/(app)/**` | API ainda não tem controllers/services de domínio (Aluno, Nota, Recado, etc.) — só o schema Prisma e os contracts existem (Fase 1). Falta uma fase própria pra isso antes da 3.2 |
