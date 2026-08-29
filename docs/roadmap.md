# Roadmap

Ordem sugerida de trabalho a partir da fundação. As fases 0 e 1 são **bloqueantes**: quase todo
o resto depende delas.

## Fase 0 — Desbloquear (precisa de ação humana)

| # | Tarefa | Status |
| - | ------ | -------------------- |
| 0.1 | Importar RFs e RNFs do Notion para `docs/requisitos/` | ✅ Concluído em 2026-08-29 |
| 0.2 | Extrair tokens do protótipo do Stitch para `globals.css` | Pendente — protótipo ainda não acessado |
| 0.3 | Responder às perguntas do [ADR 0004](adr/0004-autenticacao-e-papeis.md) — papéis e multi-tenancy | ✅ Concluído em 2026-08-29 — ver ADR 0004 e [ADR 0006](adr/0006-estrategia-multi-tenancy.md). SSO/MFA/retenção de auditoria seguem em aberto, não bloqueiam a Fase 1 |
| 0.4 | Confirmar hospedagem e restrições de conformidade (LGPD) | Pendente — bloqueia RNF-009 (SLA) e RNF-011 (RTO/RPO), não bloqueia modelagem de domínio |

## Fase 1 — Domínio

| # | Tarefa | Status |
| - | ------ | ------ |
| 1.1 | Modelar as entidades de negócio em `schema.prisma` | ✅ Concluído em 2026-08-29 — 21 modelos cobrindo RF-001 a RF-029 |
| 1.2 | Escrever os schemas de domínio em `@arbora/contracts` | ✅ Concluído em 2026-08-29 |
| 1.3 | Gerar a primeira migração e um seed representativo | ✅ Concluído em 2026-08-29 — migração `20260829190237_dominio_arbora` |
| 1.4 | Preencher `docs/requisitos/glossario.md` | ✅ Concluído em 2026-08-29 |

**Dívida aberta pela Fase 1:** RLS por `tenant_id` (segunda camada de isolamento, ver
[ADR 0006](adr/0006-estrategia-multi-tenancy.md)) ainda não configurado no banco — hoje o
isolamento entre tenants depende inteiramente da camada de aplicação. Fazer antes de qualquer
endpoint de escrita ir para produção.

## Fase 2 — Autenticação e autorização

| # | Tarefa |
| - | ------ |
| 2.1 | Hash de senha com Argon2id (substituir o placeholder do seed) |
| 2.2 | `POST /auth/login` e `POST /auth/refresh` com JWT de vida curta |
| 2.3 | `AuthGuard` e `RolesGuard` (`@Roles('admin')`) |
| 2.4 | Sessão no front: rotas protegidas e middleware do Next |
| 2.5 | Interceptor que grava em `AuditLog` |

## Fase 3 — Telas do protótipo

| # | Tarefa |
| - | ------ |
| 3.1 | Implementar as telas do Stitch, substituindo a página provisória |
| 3.2 | Camada de dados no front (TanStack Query ou Server Components + cache) |
| 3.3 | Formulários com validação a partir dos schemas de `@arbora/contracts` |
| 3.4 | Estados de carregamento, vazio e erro em todas as listagens |
| 3.5 | Revisão de acessibilidade (checklist em `docs/design-system.md`) |

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
| Hash de senha placeholder (SHA-256) | `apps/api/prisma/seed.ts` | Só o contrato de auth existe; substituir na fase 2.1 |
| Tokens de design provisórios | `apps/web/src/app/globals.css` | Protótipo inacessível |
| Página inicial temporária | `apps/web/src/app/page.tsx` | Existe para validar o stack de ponta a ponta |
| Sem cache remoto do Turborepo | `turbo.json` | Só compensa com o time maior; hoje o cache é local |
| Sem testes E2E | — | Depende de haver telas reais |
