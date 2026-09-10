# Requisitos Não-Funcionais

> Importado do Notion (`Requisitos Funcionais e Não-funcionais – Arbora`) em 2026-08-29.
> Cruzado com o baseline já implementado (tabela abaixo).

Um RNF só é útil quando é **mensurável**. "O sistema deve ser rápido" não é verificável;
"95% das requisições de listagem devem responder em menos de 400 ms com 10 mil registros" é.

## Formato

| Campo | Descrição |
| ----- | --------- |
| **Código** | `RNF-NNN` |
| **Categoria** | desempenho, segurança, disponibilidade, usabilidade, manutenibilidade, conformidade |
| **Requisito** | enunciado com número e unidade |
| **Como verificar** | teste, métrica ou auditoria que comprova o atendimento |

## Requisitos

### Segurança e Privacidade

| Código | Requisito | Como verificar | Status |
| ------ | --------- | --------------- | ------ |
| RNF-001 | Conformidade com a LGPD, considerando dados sensíveis de menores de idade | Checklist de conformidade LGPD (bases legais, consentimento dos responsáveis, DPO) | Proposto |
| RNF-002 | Criptografar dados sensíveis em trânsito (TLS/HTTPS) e em repouso | TLS obrigatório na borda (infra); criptografia de disco no banco gerenciado | Proposto |
| RNF-003 | Controle de acesso baseado em papéis (RBAC), com isolamento rígido por tenant | Testes automatizados de isolamento entre tenants (um tenant nunca lê dado de outro) | Concluído — `AuthGuard`/`RolesGuard` globais + `requireTenantId()` em todo service, testado contra Postgres real em `apps/api/test/integration/tenant-isolation.integration-spec.ts`; RLS (2ª camada do [ADR 0006](../adr/0006-estrategia-multi-tenancy.md)) segue não configurada, dívida assumida — ver [rastreabilidade.md](rastreabilidade.md) |
| RNF-004 | Trilha de auditoria para ações críticas (acesso a dados, alterações de notas/faltas) | Toda mutação crítica gera entrada em `AuditLog` com autor, timestamp e valor anterior | Em desenvolvimento — `@Audit()`/`AuditInterceptor` gravam automaticamente em 7 rotas (login/logout, nota, presença, recado, evento, status do tenant), mas não cobrem leitura nem capturam valor anterior, e o mecanismo em si não tem teste dedicado — ver [rastreabilidade.md](rastreabilidade.md) |
| RNF-005 | Exclusão/anonimização de dados de um titular mediante solicitação (direito ao esquecimento) | Endpoint administrativo de anonimização + teste que confirma dado não é mais recuperável | Proposto |

### Desempenho e Escalabilidade

| Código | Requisito | Como verificar | Status |
| ------ | --------- | --------------- | ------ |
| RNF-006 | Suportar múltiplos tenants simultâneos sem degradação perceptível de desempenho | Teste de carga com N tenants simulados | Proposto — estratégia decidida: banco compartilhado com discriminador `tenant_id`, ver [ADR 0006](../adr/0006-estrategia-multi-tenancy.md) |
| RNF-007 | Tempo de resposta de leitura (notas, agenda, recados) inferior a 2s sob carga normal | Teste de carga / APM (p95 < 2000ms) | Proposto |
| RNF-008 | Suportar crescimento horizontal conforme aumento de escolas/usuários | API stateless (verificável hoje) + teste de escala horizontal do banco quando necessário | Proposto |

### Disponibilidade e Confiabilidade

| Código | Requisito | Como verificar | Status |
| ------ | --------- | --------------- | ------ |
| RNF-009 | Disponibilidade mínima de 99,5% em horário letivo/comercial | Monitoramento de uptime (roadmap 5.4) | Proposto — depende de confirmar hospedagem (roadmap 0.4) |
| RNF-010 | Backups automáticos periódicos por tenant | Job de backup agendado + teste de restauração (roadmap 5.5) | Proposto |
| RNF-011 | Estratégia de recuperação de desastres (RTO/RPO definidos) | Documento de DR com RTO/RPO testado | Proposto — RTO/RPO ainda não definidos, depende de roadmap 0.4 |

### Usabilidade

| Código | Requisito | Como verificar | Status |
| ------ | --------- | --------------- | ------ |
| RNF-012 | Interface do responsável mobile-first | Revisão de design + teste em viewport mobile como padrão | Em desenvolvimento — dashboard do responsável já implementado mobile-first (`responsavel-dashboard-client.tsx`, layout `max-w-sm`), sem teste de viewport automatizado |
| RNF-013 | Acessível conforme WCAG | Auditoria de acessibilidade (axe/Lighthouse) sem violações críticas | Em desenvolvimento — auditoria manual completa feita na Fase 3.5 (contraste AA/AAA, `aria-label`, `role="alert"`, tema alto-contraste) além de `eslint-plugin-jsx-a11y`; falta automação em CI (axe/Lighthouse) |
| RNF-014 | Navegação exigir no máximo poucos toques para notas, faltas e recados | Teste de usabilidade / contagem de cliques até a informação | Proposto |

### Compatibilidade

| Código | Requisito | Como verificar | Status |
| ------ | --------- | --------------- | ------ |
| RNF-015 | Funcionar em navegadores modernos (Chrome, Safari, Firefox, Edge); PWA instalável se aplicável | Matriz de testes cross-browser + Lighthouse PWA audit | Parcial — PWA instalável pro papel `RESPONSAVEL` (roadmap 6.3): manifest + service worker com cache só de asset estático, sem fila de mutação offline. Matriz cross-browser e Lighthouse não rodados. |
| RNF-016 | Responsivo em mobile, tablet e desktop | Teste visual em breakpoints definidos no design system | Proposto |

### Manutenibilidade

| Código | Requisito | Como verificar | Status |
| ------ | --------- | --------------- | ------ |
| RNF-017 | Arquitetura modular, evolução independente dos módulos (acadêmico, comunicação, agenda) | Revisão de arquitetura | Concluído — monorepo com `apps/web`, `apps/api`, `packages/contracts` já modular (ADR 0001) |
| RNF-018 | Testes automatizados cobrindo regras de negócio críticas (frequência, notas, isolamento entre tenants) | Cobertura mínima no CI (roadmap 4.3) | Concluído — os três exemplos citados têm teste real (`alunos.service.spec.ts`/`dashboard.service.spec.ts`, `professor.service.spec.ts`, `tenant-isolation.integration-spec.ts`) e `pnpm check` roda com `coverageThreshold` mínimo (roadmap 4.3) |

### Notificações

| Código | Requisito | Como verificar | Status |
| ------ | --------- | --------------- | ------ |
| RNF-019 | Suportar múltiplos canais de notificação (push, e-mail, opcionalmente SMS/WhatsApp) com fallback entre canais | Teste de falha de canal primário disparando o fallback | Proposto |

---

## Baseline já implementado

Independentemente do que os requisitos vierem a exigir, a fundação do projeto já entrega:

| Categoria | O que existe | Onde |
| --------- | ------------ | ---- |
| Segurança | Cabeçalhos HTTP seguros (`helmet`) | `apps/api/src/main.ts` |
| Segurança | CORS restrito por lista de origens | `apps/api/src/config/env.ts` |
| Segurança | Rate limit global configurável | `apps/api/src/app.module.ts` |
| Segurança | Segredos fora do versionamento | `.gitignore`, `*.env.example` |
| Segurança | Erros sem stack trace para o cliente | `all-exceptions.filter.ts` |
| Privacidade | Redação de credenciais e tokens nos logs | `apps/api/src/app.module.ts` |
| Auditabilidade | Modelo `AuditLog` e exclusão lógica | `apps/api/prisma/schema.prisma` |
| Confiabilidade | Health check e liveness probe separados | `apps/api/src/health/` |
| Observabilidade | Log estruturado JSON com `requestId` | `nestjs-pino` |
| Manutenibilidade | Lint, typecheck e testes obrigatórios no CI | `.github/workflows/ci.yml` |
| Desempenho | Limite máximo de página nas listagens | `packages/contracts/src/common/pagination.ts` |
| Acessibilidade | `eslint-plugin-jsx-a11y` e foco sempre visível | `packages/eslint-config/react.js`, `globals.css` |

## Perguntas que os RNFs ainda não responderam

- [ ] Quantos usuários simultâneos e qual volume de dados esperado (dimensiona RNF-006/007/008)?
- [ ] Onde será hospedado (nuvem pública, on-premises do cliente)? Bloqueia RNF-009/011 — roadmap 0.4.
- [ ] Há exigência de idioma além do português?
- [ ] RTO/RPO específicos para RNF-011.
- [ ] SLA de janela de manutenção para RNF-009.
