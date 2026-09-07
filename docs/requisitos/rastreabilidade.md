# Matriz de rastreabilidade

Liga cada requisito ao código que o implementa e ao teste que o comprova. Serve para responder
duas perguntas com precisão:

- "O requisito RF-012 está pronto?" → olhe a linha dele.
- "Posso mudar este arquivo?" → veja quais requisitos dependem dele.

**Status** segue o vocabulário de `funcionais.md`/`nao-funcionais.md`: `Concluído` (implementado e
testado), `Em desenvolvimento` (parcial — falta ação, tela, ou cobertura), `Pendente` (nada
implementado). Um requisito com modelo no `schema.prisma` mas sem controller/endpoint que o
exponha conta como **não implementado** — modelar não é implementar.

Levantado em 2026-09-07 lendo o código real (controllers, services, testes), não só o schema.

## Requisitos Funcionais

| Código | Requisito | Implementação | Teste | Status |
| ------ | --------- | -------------- | ----- | ------ |
| RF-001 | Login multi-perfil | `apps/api/src/auth/auth.controller.ts` (`POST /auth/login`), `auth.service.ts`, `password.service.ts` (argon2id); `UserRole` (5 papéis) em `schema.prisma`; `apps/web/src/app/login/page.tsx`, `middleware.ts` | `auth.service.spec.ts`, `auth.guard.spec.ts`, `apps/web/e2e/login.spec.ts` | Concluído |
| RF-002 | JWT com refresh (rotação) | `auth.controller.ts` (`POST /auth/refresh`), `auth.service.ts` (revoga o token usado, emite novo); model `RefreshToken` (hash armazenado) | `auth.service.spec.ts`, `auth.guard.spec.ts` | Concluído |
| RF-003 | Recuperação de senha (e-mail/SMS) | Nenhuma — `apps/web/src/app/recuperar-senha/page.tsx` é um stub explícito, sem endpoint na API nem provedor de e-mail/SMS | Nenhum | Pendente |
| RF-004 | Associar múltiplos responsáveis a um aluno | `alunos.controller.ts` (`POST /alunos/:id/responsaveis`, `DELETE /alunos/:id/responsaveis/:responsavelId`, `@Roles('ADMIN_ESCOLAR', 'COORDENACAO')`); `alunos.service.ts` (`vincularResponsavel` resolve por e-mail — reaproveita conta `RESPONSAVEL` existente do mesmo tenant, rejeita e-mail de outro papel/tenant, cria conta nova com senha obrigatória só nesse caso; `desvincularResponsavel`). `apps/web/.../alunos/[id]/vincular-responsavel-dialog.tsx` e `remover-responsavel-button.tsx` na tela de perfil | `alunos.service.spec.ts` (17 casos: criar/reaproveitar/rejeitar conta, conflito de vínculo, desvincular), `vincular-responsavel-dialog.spec.tsx`, `apps/web/e2e/admin.spec.ts` | Concluído |
| RF-005 | Restringir responsável aos alunos vinculados | `apps/api/src/responsavel/responsavel.controller.ts` (`@Roles('RESPONSAVEL')`), `responsavel.service.ts` (`listarAlunos` filtra por `responsavelId`; `listarMovimentacoes` lança `ForbiddenException` sem vínculo) | `responsavel.service.spec.ts` | Concluído |
| RF-006 | Isolar dados entre tenants | `tenantId` obrigatório/indexado em toda tabela de escola; `requireTenantId()` (`common/tenant.util.ts`) usado em todo service; ADR 0006 | `apps/api/test/integration/tenant-isolation.integration-spec.ts` (Postgres real, 2 tenants sobrepostos) | Concluído — RLS (2ª camada do ADR) segue não configurada, dívida assumida, não invalida o isolamento já testado |
| RF-007 | Cadastro/config de nova escola (tenant) | `tenants.controller.ts` (`POST /tenants`, `@Roles('SUPER_ADMIN')`, `@Audit('TENANT_CRIADO')`) — único endpoint de domínio sem `requireTenantId()`, proposital; `tenants.service.ts` (`criar()`, conflito de slug duplicado vira `ConflictException`); `apps/web/.../super-admin/nova-instituicao-dialog.tsx` | `tenants.service.spec.ts`, `nova-instituicao-dialog.spec.tsx`, `apps/web/e2e/super-admin.spec.ts` | Concluído |
| RF-008 | Super-admin gerencia tenants (ativação/suspensão/planos) | `tenants.controller.ts` (`GET /`, `PATCH /:id/status`, `@Roles('SUPER_ADMIN')`, `@Audit('TENANT_STATUS_ALTERADO')`); `dashboard.controller.ts` (`GET /dashboard/super-admin`) | `tenants.service.spec.ts`, `apps/web/e2e/super-admin.spec.ts` | Concluído para ativação/suspensão; "plano contratado" é só um campo string estático, sem UI/endpoint dedicado |
| RF-009 | Cadastro de alunos/turmas/disciplinas/professores | `POST /turmas` e `POST /disciplinas` (módulos novos, `apps/api/src/turmas/`, `apps/api/src/disciplinas/`); `POST /alunos` (estende `alunos.controller.ts`/`.service.ts`, valida que `turmaId` pertence ao mesmo tenant antes de criar); `POST /usuarios` (módulo novo `apps/api/src/usuarios/`, cadastra professor — `User` com `role: PROFESSOR` fixo, reaproveita `registerRequestSchema`/`passwordSchema` de `auth.ts` que já existiam e nunca tinham sido usados; senha definida pelo admin no formulário, sem convite por e-mail). Telas novas: `/turmas`, `/disciplinas`, `/professores`, e `/alunos` ganha o diálogo de cadastro | `turmas.service.spec.ts`, `disciplinas.service.spec.ts`, `alunos.service.spec.ts` (casos de `criar`, incl. `turmaId` de outro tenant), `usuarios.service.spec.ts`, `academic-create-isolation.integration-spec.ts` (Postgres real: turma de um tenant não pode ser usada por outro), 4 `*-dialog.spec.tsx`, `apps/web/e2e/admin.spec.ts` | Concluído — **fora do escopo**: atribuir o professor recém-criado a uma turma+disciplina (`TurmaDisciplina`, o que de fato libera lançar nota/chamada) segue pendente, cadastro cria só a conta. Vincular responsável ao aluno (RF-004) foi resolvido depois, ver a linha RF-004 |
| RF-010 | Lançamento de notas | `apps/api/src/professor/professor.controller.ts` (`PUT /professor/notas`, `@Audit('NOTA_LANCADA')`), `professor.service.ts` (upsert); `apps/web/.../notas/` com validação client-side (0–10) | `professor.service.spec.ts`, `apps/web/e2e/professor.spec.ts` | Concluído |
| RF-011 | Exibir boletim/histórico ao responsável | Não existe. `AlunosService.perfil` (média/notas recentes) só é exposto a `ADMIN_ESCOLAR`/`COORDENACAO`/`PROFESSOR`; `ResponsavelController` só expõe alunos e movimentações — nada de notas | `alunos.service.spec.ts` testa `perfil()` do ponto de vista do staff, não do responsável | Em desenvolvimento — funciona para a escola olhar o aluno; para o responsável, ator do RF, não há endpoint nem tela |
| RF-012 | Lançamento de presença/falta | `professor.controller.ts` (`PUT /professor/presencas`, `@Audit('PRESENCA_REGISTRADA')`), upsert em lote transacional; `apps/web/.../chamada/` | `professor.service.spec.ts`, `apps/web/e2e/professor.spec.ts` | Concluído |
| RF-013 | Notificar responsável em caso de falta | Nenhuma — `registrarPresencas()` só grava `Presenca`, nunca cria `Notificacao` (enum `NotificacaoTipo.FALTA` existe no schema, não é usado) | Nenhum | Pendente |
| RF-014 | Calcular frequência e alertar risco | `alunos.service.ts` (`calcularFrequencia`, janela de 30 dias), `dashboard.service.ts` (`atencaoNecessaria`, limiar 80%) | `alunos.service.spec.ts`, `dashboard.service.spec.ts`, `apps/web/e2e/admin.spec.ts` | Concluído |
| RF-015 | Enviar recados (individual/turma/instituição) | `apps/api/src/recados/recados.controller.ts` (`GET`/`POST`, `@Audit('RECADO_PUBLICADO')`), valida `turmaId`/`alunoId` por tipo; `apps/web/.../comunicados/` | `recados.service.spec.ts`, `apps/web/e2e/admin.spec.ts` | Concluído do lado escola — `RESPONSAVEL` não consegue nem listar recados hoje (fora do escopo do RF, mas limita RF-016) |
| RF-016 | Responsável confirma leitura de recado | Model `RecadoConfirmacaoLeitura` só é usado pra calcular `leituraPercentual` (estatística pra escola, a partir de dado semeado) — nenhum endpoint permite a um responsável confirmar leitura de fato | `recados.service.spec.ts` testa o cálculo, não a ação | Pendente — a ação em si não existe |
| RF-017 | Anexar arquivos aos recados | Model `RecadoAnexo` existe no schema, zero uso em `src/` ou seed. Sem endpoint de upload/storage | Nenhum | Pendente |
| RF-018 | Notificações push/e-mail de novo recado | Nenhuma — publicar recado não gera `Notificacao` | Nenhum | Pendente |
| RF-019 | Mensagens diretas responsável↔escola | Models `Conversa`/`Mensagem` + `Tenant.mensagensDiretasHabilitadas` existem no schema, zero uso em controllers/services | Nenhum | Pendente |
| RF-020 | Registrar entrada/saída (portaria) | Model `Movimentacao`, só semeado. Exposição só-leitura via `ResponsavelController`/`AlunosService.perfil`. Nenhum endpoint de escrita/tela de portaria | `responsavel.service.spec.ts`, `alunos.service.spec.ts` | Em desenvolvimento — exibição implementada e testada; "registrar" em si não existe |
| RF-021 | Notificar responsável de movimentações | Nenhuma — nenhum `Notificacao` é criado a partir de `Movimentacao` | Nenhum | Pendente |
| RF-022 | Registrar ocorrências, visíveis ao responsável | Model `Ocorrencia`, só semeado (1 registro). Exposto só em `AlunosService.perfil` → página restrita a staff. Não visível ao responsável; sem endpoint de escrita | Nenhum dedicado (`perfil()` testado com array vazio) | Em desenvolvimento — modelo + exibição pra staff existem; visibilidade ao responsável e registro não |
| RF-023 | Autorização prévia de retirada por terceiros | Model `TerceiroAutorizado`, zero uso em `src/` ou seed. Botão `disabled` "Gerenciar autorizados (em breve)" no dashboard do responsável | Nenhum | Pendente |
| RF-024 | Exibir calendário escolar | `apps/api/src/eventos/eventos.controller.ts` (`GET /eventos`); enum `EventoTipo`; `apps/web/.../agenda/page.tsx` (grade mensal + próximos eventos) | `eventos.service.spec.ts` | Concluído — sem cobertura e2e |
| RF-025 | Cadastrar eventos por turma | `eventos.controller.ts` (`POST /eventos`, `@Roles('ADMIN_ESCOLAR','COORDENACAO')`, `@Audit('EVENTO_CRIADO')`); validação client-side | `eventos.service.spec.ts` | Concluído — sem cobertura e2e |
| RF-026 | Sincronização/exportação da agenda (iCal etc.) | Nenhuma | Nenhum | Pendente |
| RF-027 | Lembretes de eventos próximos | Nenhuma — sem cron/scheduler no código | Nenhum | Pendente |
| RF-028 | Relatórios (frequência, desempenho, comunicados) por turma/aluno | `dashboard.service.ts` (`admin()`: frequência média, faltas hoje, comunicados recentes, atenção necessária) — indicadores agregados por instituição; `AlunosService.listar()` mostra frequência por aluno. Sem drill-down por turma nem exportação/PDF | `dashboard.service.spec.ts`, `apps/web/e2e/admin.spec.ts` | Em desenvolvimento — indicadores agregados reais e testados; "relatório" com exportação não existe |
| RF-029 | Log de auditoria (quem, quando, valor anterior) | Model `AuditLog`; `apps/api/src/common/audit/` (`@Audit()` + `AuditInterceptor` + `AuditService`), aplicado em 7 rotas (login/logout, nota, presença, recado, evento, status do tenant). Captura autor/timestamp/ip, mas **não** captura valor anterior (`metadata` nunca preenchido) | Nenhum teste dedicado ao interceptor/service em si | Em desenvolvimento — gravação automática real em 7 endpoints, mas sem valor anterior e sem teste do mecanismo |

## Requisitos Não-Funcionais

| Código | Requisito | Como verificar (real, hoje) | Status |
| ------ | --------- | ---------------------------- | ------ |
| RNF-001 | Conformidade LGPD (menores) | Nenhum checklist, base legal ou fluxo de consentimento no código | Pendente |
| RNF-002 | Criptografia em trânsito/repouso | `helmet()` em `main.ts`; cookies `secure` em produção; TLS/disco dependem de hospedagem (roadmap 0.4) | Pendente |
| RNF-003 | RBAC + isolamento rígido por tenant | `AuthGuard`+`RolesGuard` globais (`APP_GUARD`); `@Roles()` por rota; `requireTenantId()` em todo service — testado por `roles.guard.spec.ts`, `auth.guard.spec.ts` e `tenant-isolation.integration-spec.ts` | **Concluído** |
| RNF-004 | Trilha de auditoria para ações críticas | `AuditInterceptor` grava automaticamente em 7 rotas mutantes; não cobre leitura nem valor anterior; sem teste dedicado ao mecanismo | Em desenvolvimento |
| RNF-005 | Anonimização/exclusão sob solicitação | Só soft-delete genérico (`deletedAt`) em alguns modelos; nenhum fluxo de "direito ao esquecimento" | Pendente |
| RNF-006 | Múltiplos tenants sem degradação | Arquitetura decidida (ADR 0006), nenhum teste de carga executado | Pendente |
| RNF-007 | Leitura < 2s p95 sob carga | Nenhuma infra de APM/teste de carga | Pendente |
| RNF-008 | Crescimento horizontal | API é stateless de fato (JWT + refresh no banco, sem sessão em memória); sem teste de escala do banco | Parcial — afirmação estrutural já verdadeira, resto sem verificação |
| RNF-009 | Disponibilidade 99,5% | Nenhum monitoramento de uptime; hospedagem não definida | Pendente |
| RNF-010 | Backups automáticos por tenant | Nenhum job de backup | Pendente |
| RNF-011 | Estratégia de DR (RTO/RPO) | Nenhum RTO/RPO definido | Pendente |
| RNF-012 | Interface do responsável mobile-first | `responsavel-dashboard-client.tsx` — comentário explícito "mobile-first, 390px", `max-w-sm`; sem teste de viewport automatizado | Em desenvolvimento |
| RNF-013 | Acessível conforme WCAG | `eslint-plugin-jsx-a11y`; auditoria manual completa na Fase 3.5 (contraste AA/AAA, `aria-label`, `role="alert"`, tema alto-contraste); `apps/web/e2e/login.spec.ts` testa erro anunciado por leitor de tela. Sem axe/Lighthouse automatizado em CI | Em desenvolvimento — auditoria manual feita, automação em CI não |
| RNF-014 | Poucos toques até notas/faltas/recados | Nenhum teste de usabilidade/contagem de cliques | Pendente |
| RNF-015 | Navegadores modernos + PWA | Nenhum manifest/service worker; Playwright roda só Chromium hoje | Pendente |
| RNF-016 | Responsivo mobile/tablet/desktop | Classes responsivas do Tailwind (`sm:`, `lg:`) usadas nas páginas; sem teste visual por breakpoint | Em desenvolvimento |
| RNF-017 | Arquitetura modular | Monorepo `apps/web`/`apps/api`/`packages/contracts` (+`eslint-config`); ADR 0001 | Concluído |
| RNF-018 | Testes cobrindo regras de negócio críticas (frequência, notas, isolamento) | Frequência: `alunos.service.spec.ts`, `dashboard.service.spec.ts`. Notas: `professor.service.spec.ts`. Isolamento: `tenant-isolation.integration-spec.ts`. `coverageThreshold` em `apps/api/package.json`, `apps/web/vitest.config.ts`, `packages/contracts/vitest.config.ts` | **Concluído** |
| RNF-019 | Múltiplos canais de notificação com fallback | Model `Notificacao` + enums `NotificacaoCanal`/`NotificacaoStatus` modelados pra isso, zero código de serviço/controller cria ou envia notificação nenhuma | Pendente |

## Padrões observados

- **Modelado mas não implementado**: RF-016 a RF-023 (exceto RF-015) têm modelo Prisma completo,
  mas nenhum controller expõe além de leitura agregada ou seed. Modelar não é implementar — ver
  nota no topo deste documento.
- **"Cadastro" ausente (RF-007/RF-009, resolvido em 2026-09-07)**: até aqui, tenant/turma/
  disciplina/aluno/professor só tinham leitura (+ uma ação pontual de update no caso do tenant) —
  todo dado "cadastrado" vinha de `apps/api/prisma/seed.ts`. Ver linhas RF-007/RF-009 acima pro
  que foi implementado e o que ainda ficou de fora (vínculo de responsável, atribuição de
  turma+disciplina ao professor).
- **Notificações**: modelo `Notificacao` existe pra RF-013/018/021/RNF-019, nenhum código o usa —
  é o requisito estrutural que mais falta.

## Como manter

- Ao abrir um PR que implementa um requisito, cite o código na descrição (`Implementa RF-012`) e
  atualize a linha correspondente.
- Um requisito só vira `Concluído` quando **todos** os seus critérios de aceite têm teste
  automatizado passando no CI.
- Um modelo no `schema.prisma` sem controller que o exponha não é "implementado" — é só desenho de
  dado. Marque `Pendente` ou `Em desenvolvimento`, nunca `Concluído`, até existir o endpoint (ou a
  tela) que o usa de verdade.
