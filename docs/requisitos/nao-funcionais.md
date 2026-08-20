# Requisitos Não-Funcionais

> **Pendente de importação.** Ver [`README.md`](README.md) desta pasta.

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

| Código | Categoria | Requisito | Como verificar | Status |
| ------ | --------- | --------- | -------------- | ------ |
| RNF-001 | _(a preencher a partir do Notion)_ | | | Proposto |

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

Ao importar os RNFs, cruze cada um com esta tabela: o que já está coberto vira `Concluído`;
o que não está entra no [roadmap](../roadmap.md).

## Perguntas que os RNFs precisam responder

- [ ] Quantos usuários simultâneos e qual volume de dados esperado?
- [ ] Qual meta de disponibilidade (SLA) e janela de manutenção?
- [ ] Há dados pessoais em escopo da LGPD? Quais e por quanto tempo retidos?
- [ ] O sistema precisa funcionar offline ou em rede instável (uso em campo)?
- [ ] Precisa ser responsivo/mobile? É um PWA ou app nativo?
- [ ] Há exigência de idioma além do português?
- [ ] Onde será hospedado (nuvem pública, on-premises do cliente)?
- [ ] Há requisito de RPO/RTO para backup e recuperação?
