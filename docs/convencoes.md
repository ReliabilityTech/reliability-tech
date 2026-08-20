# Convenções

## Commits — Conventional Commits

```
<tipo>(<escopo>): <descrição no imperativo, em minúsculas>
```

| Tipo | Quando usar |
| ---- | ----------- |
| `feat` | nova funcionalidade |
| `fix` | correção de defeito |
| `refactor` | mudança interna sem alterar comportamento |
| `perf` | melhoria de desempenho |
| `test` | adição ou correção de testes |
| `docs` | somente documentação |
| `chore` | tarefas de manutenção, dependências |
| `ci` | pipeline e automações |
| `build` | build, empacotamento, configuração de ferramentas |

**Escopos:** `api`, `web`, `contracts`, `docs`, `infra`, `ci`, `deps`.

```bash
feat(api): adicionar endpoint de listagem de ativos
fix(web): corrigir foco preso no modal de filtros
docs(requisitos): importar RFs do Notion
```

Quando o commit implementa um requisito, cite o código no corpo: `Implementa RF-012.`

O `commitlint` valida o formato no hook `commit-msg`.

## Branches

```
<tipo>/<descricao-curta-em-kebab-case>
```

`feat/cadastro-de-ativos`, `fix/erro-500-no-health`, `docs/adr-multitenancy`.

## Pull Requests

- **Pequenos.** Um PR que faz uma coisa é revisado de verdade; um PR de 2.000 linhas é aprovado
  no escuro.
- Descreva **o quê** e **por quê** — o *como* está no diff.
- Cite os requisitos atendidos.
- O CI precisa estar verde antes da revisão.
- Toda mudança de comportamento vem com teste.

## Código

### Nomenclatura

| Elemento | Convenção | Exemplo |
| -------- | --------- | ------- |
| Arquivos | `kebab-case` | `health.service.ts`, `status-card.tsx` |
| Classes, componentes React, tipos | `PascalCase` | `HealthService`, `StatusCard` |
| Funções e variáveis | `camelCase` | `buildPaginationMeta` |
| Constantes globais | `SCREAMING_SNAKE_CASE` | `MAX_PAGE_SIZE` |
| Tabelas do banco | `snake_case` plural | `audit_logs` |
| Rotas HTTP | `kebab-case` plural | `/api/v1/ordens-de-servico` |

Termos do domínio em **português** (ver [glossário](requisitos/glossario.md)); termos de
framework em inglês.

### Idioma

- Código de domínio, comentários, mensagens de erro para o usuário e documentação: **português**.
- Nomes de bibliotecas, padrões e APIs externas: como são originalmente.

### TypeScript

- `strict` ligado, incluindo `noUncheckedIndexedAccess`. Sem `@ts-ignore` sem justificativa
  escrita ao lado.
- `any` é a exceção que se explica no código; prefira `unknown` e um refinamento.
- Toda função exportada tem tipo de retorno explícito.
- Imports de tipo usam `import type`.

### Comentários

Comente **o porquê**, não o quê. Se o código precisa de comentário para dizer o que faz,
normalmente ele precisa de um nome melhor.

### Testes

- Unitários ao lado do código (`*.spec.ts`).
- Nomes de teste descrevem comportamento observável, em português:
  `it('rejeita pageSize acima do limite máximo')`.
- Um teste por comportamento — não um teste que verifica dez coisas.
- Todo bug corrigido ganha um teste que falharia antes da correção.

## Antes de abrir o PR

```bash
pnpm check   # format, lint, typecheck e testes — o mesmo que o CI executa
```
