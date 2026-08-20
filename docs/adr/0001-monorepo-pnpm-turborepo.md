# ADR 0001 — Adotar monorepo com pnpm workspaces e Turborepo

- **Status:** Aceito
- **Data:** 2026-08-20

## Contexto

O Arbora nasce com pelo menos dois artefatos (web e API) que precisam concordar sobre o formato
dos dados. Em repositórios separados, essa concordância vira um contrato informal: alguém altera
um campo na API, o front descobre em produção.

O time é pequeno no início do projeto, o que torna o custo de coordenar múltiplos repositórios
(versionar e publicar pacotes internos, sincronizar PRs) desproporcional ao benefício.

## Decisão

Um único repositório, com **pnpm workspaces** para o grafo de dependências e **Turborepo** para
orquestrar e cachear as tarefas (`build`, `lint`, `typecheck`, `test`).

## Alternativas consideradas

| Alternativa | Por que foi descartada |
| ----------- | ---------------------- |
| Repositórios separados | Contrato entre front e API deixa de ser verificável em tempo de compilação; mudanças coordenadas exigem PRs sincronizados. |
| Monorepo com npm/yarn workspaces | pnpm é mais rápido e usa `node_modules` estrito, o que impede dependências fantasma — uma classe de bug que só aparece no CI. |
| Nx | Mais poderoso, mas com curva de aprendizado e configuração maiores do que este estágio justifica. |

## Consequências

**Positivas:**

- Uma mudança de contrato e seus dois lados cabem no mesmo PR e são validados juntos.
- `pnpm check` reproduz exatamente o que o CI executa.
- Cache do Turborepo torna o CI incremental.

**Negativas / custos aceitos:**

- Um só histórico de commits para produtos diferentes; disciplina de escopo nos commits passa a
  importar (ver `docs/convencoes.md`).
- Deploy precisa filtrar o que mudou em vez de simplesmente publicar o repositório inteiro.

**Quando revisitar:** se um pacote passar a ter ciclo de release independente e consumidores
externos ao repositório.
