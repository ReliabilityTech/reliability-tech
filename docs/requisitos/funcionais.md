# Requisitos Funcionais

> Importado do Notion (`Requisitos Funcionais e Não-funcionais – Arbora`) em 2026-08-29.
> Prioridade (MoSCoW) ainda **não foi definida pelo produto** no material recebido — todos os
> itens estão como `A definir` até isso ser confirmado. Não inventar prioridade aqui: ela decide
> ordem de implementação.

Cada requisito descreve **o que** o sistema faz, do ponto de vista de quem usa — não como é
implementado.

## Formato

| Campo | Descrição |
| ----- | --------- |
| **Código** | `RF-NNN`, estável e nunca reutilizado |
| **Requisito** | uma frase no formato "O sistema deve…" |
| **Ator** | quem dispara a ação |
| **Prioridade** | `Must` / `Should` / `Could` / `Won't` (MoSCoW) |
| **Critérios de aceite** | condições verificáveis; viram testes |
| **Status** | `Proposto` / `Aprovado` / `Em desenvolvimento` / `Concluído` / `Cancelado` |

## Requisitos

### Autenticação e Perfis

| Código | Requisito | Ator | Prioridade | Status |
| ------ | --------- | ---- | ---------- | ------ |
| RF-001 | Permitir login de usuários com diferentes perfis (administrador escolar, coordenação/secretaria, professor, responsável/pai) | Todos os perfis | A definir | Proposto |
| RF-002 | Autenticação via JWT com renovação de token (refresh token) | Sistema | A definir | Proposto |
| RF-003 | Recuperação de senha via e-mail/SMS | Usuário | A definir | Proposto |
| RF-004 | Associar um ou mais responsáveis a um ou mais alunos (ex.: pai e mãe separados, ambos com acesso) | Coordenação/secretaria | A definir | Proposto |
| RF-005 | Restringir o acesso do responsável apenas aos dados dos alunos vinculados a ele | Sistema | A definir | Proposto |

### Multi-tenancy

| Código | Requisito | Ator | Prioridade | Status |
| ------ | --------- | ---- | ---------- | ------ |
| RF-006 | Isolar completamente os dados de cada instituição de ensino (tenant), impedindo vazamento entre escolas | Sistema | A definir | Proposto |
| RF-007 | Permitir cadastro e configuração de uma nova escola (tenant) de forma independente (identidade visual, calendário letivo, séries/turmas) | Super-admin | A definir | Proposto |
| RF-008 | Permitir que um super-admin gerencie múltiplos tenants (ativação, suspensão, planos contratados) | Super-admin | A definir | Proposto |

### Gestão Acadêmica

| Código | Requisito | Ator | Prioridade | Status |
| ------ | --------- | ---- | ---------- | ------ |
| RF-009 | Cadastro de alunos, turmas, disciplinas e professores | Coordenação/secretaria | A definir | Proposto |
| RF-010 | Lançamento de notas por disciplina/bimestre/trimestre | Professor | A definir | Proposto |
| RF-011 | Exibir ao responsável o boletim/histórico de notas do aluno | Responsável | A definir | Proposto |
| RF-012 | Lançamento de presença/falta por aula ou por dia letivo | Professor | A definir | Proposto |
| RF-013 | Notificar o responsável em caso de falta do aluno (imediato ou resumo diário) | Sistema | A definir | Proposto |
| RF-014 | Calcular automaticamente percentual de frequência e alertar sobre risco de reprovação por faltas | Sistema | A definir | Proposto |

### Comunicação (Recados)

| Código | Requisito | Ator | Prioridade | Status |
| ------ | --------- | ---- | ---------- | ------ |
| RF-015 | Enviar recados/comunicados individuais, por turma ou para toda a instituição | Escola | A definir | Proposto |
| RF-016 | Permitir que o responsável confirme a leitura/ciência de um recado | Responsável | A definir | Proposto |
| RF-017 | Anexar arquivos (circulares, autorizações) aos recados | Escola | A definir | Proposto |
| RF-018 | Enviar notificações push/e-mail quando um novo recado for publicado | Sistema | A definir | Proposto |
| RF-019 | Canal de mensagens diretas entre responsável e escola/professor, com limites definidos pela instituição (opcional) | Responsável / Escola | A definir | Proposto |

### Movimentações do Aluno

| Código | Requisito | Ator | Prioridade | Status |
| ------ | --------- | ---- | ---------- | ------ |
| RF-020 | Registrar entrada e saída do aluno na instituição (portaria/controle de acesso), quando aplicável | Escola | A definir | Proposto |
| RF-021 | Notificar o responsável sobre movimentações relevantes (ex.: saída antecipada, retirada por terceiros) | Sistema | A definir | Proposto |
| RF-022 | Registrar ocorrências disciplinares ou de saúde, visíveis ao responsável | Coordenação/secretaria | A definir | Proposto |
| RF-023 | Permitir autorização prévia de responsáveis para retirada do aluno por terceiros cadastrados | Responsável | A definir | Proposto |

### Agenda

| Código | Requisito | Ator | Prioridade | Status |
| ------ | --------- | ---- | ---------- | ------ |
| RF-024 | Exibir calendário escolar com eventos, provas, reuniões e feriados | Sistema | A definir | Proposto |
| RF-025 | Cadastrar eventos e associá-los a turmas específicas | Coordenação/secretaria | A definir | Proposto |
| RF-026 | Sincronização/exportação da agenda (ex.: iCal, Google Calendar) | Responsável | A definir | Proposto |
| RF-027 | Enviar lembretes de eventos próximos ao responsável | Sistema | A definir | Proposto |

### Administração

| Código | Requisito | Ator | Prioridade | Status |
| ------ | --------- | ---- | ---------- | ------ |
| RF-028 | Gerar relatórios (frequência, desempenho, comunicados enviados) por turma/aluno | Administrador escolar | A definir | Proposto |
| RF-029 | Manter log de auditoria de alterações em notas e faltas (quem alterou, quando, valor anterior) | Sistema | A definir | Proposto |

---

## Detalhamento

Fluxos, pré-condições e critérios de aceite por requisito são preenchidos quando cada RF entra em
desenvolvimento (roadmap Fase 1.4 / Fase 3), a partir do protótipo do Stitch — ainda não acessado
(ver [roadmap](../roadmap.md), tarefa 0.2). Manter o template abaixo para o primeiro requisito
detalhado.

### RF-001 — _(título)_

**Descrição:** _(a preencher)_

**Ator:** _(a preencher)_

**Pré-condições:** _(a preencher)_

**Fluxo principal:**

1. _(a preencher)_

**Fluxos alternativos e de exceção:**

- _(a preencher)_

**Critérios de aceite:**

- [ ] Dado _(contexto)_, quando _(ação)_, então _(resultado observável)_.

**Regras de negócio relacionadas:** _(RN-NNN)_

**Telas do protótipo:** _(link/nome da tela no Stitch)_
