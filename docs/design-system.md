# Design system

## Estado atual

Design system extraído do próprio protótipo do Stitch ("Portal Escolar Multi-tenant") em
2026-08-30/31 — o protótipo tem um frame dedicado "Arbora Design System" com a paleta exata e a
tipografia, achado na segunda passada de exploração (a primeira só tinha o texto que a IA do
Stitch escreveu descrevendo o projeto, sem pixel).

**Paleta** (hex exato, lido do frame de estilo):

| Papel | Hex | Uso no protótipo |
| ----- | --- | ----------------- |
| Primary | `#26734D` | Verde institucional — sidebar, botões primários |
| Secondary | `#174D35` | Verde mais escuro — hover/estados ativos |
| Tertiary | `#EAF5EF` | Verde bem claro — fundo de ícones, superfície com tint |
| Neutral | `#1F2933` | Texto/tinta — não é preto puro |

Convertidos para OKLCH em `globals.css` (`--color-brand-50/600/800` para Tertiary/Primary/
Secondary, `--color-foreground`/`--color-surface` para Neutral) — mesmo matiz, luminosidade e
croma proporcionais ao hex original; o resto da rampa (100–500, 700, 900) é interpolado entre
esses três pontos.

**Tipografia:** `Manrope`, carregada via `next/font/google` em `apps/web/src/app/layout.tsx` e
exposta como `--font-manrope` (primeira opção de `--font-sans`). O protótipo usa 3 níveis
("Headline", "Body", "Label") mas não expõe tamanho em px — ficou com a escala padrão do Tailwind.

**Componentes confirmados no frame de estilo:** botão Primary (preenchido) / Secondary
(contornado) / Inverted / Outlined; campo de busca com ícone; botões de ícone circulares;
badges de status coloridos.

> O protótipo é uma tela (canvas) renderizada, sem DOM acessível — não existe "inspecionar
> elemento" nem export de CSS. Tudo acima veio de zoom manual em cada frame (via
> `Zoom to Selection` no menu de zoom do Stitch). Se precisar de mais fidelidade depois, ainda vale
> pedir um export/screenshot direto em vez de repetir a navegação do canvas.

### Telas do protótipo (inventário completo)

10 telas, todas na mesma identidade visual. Nomes como aparecem no Stitch:

| Tela | Papel(is) | Conteúdo confirmado |
| ---- | --------- | -------------------- |
| Login - Arbora | Todos | Painel de marca (logo, "Escola e família mais próximas.") + formulário (e-mail, senha, lembrar de mim, esqueci senha) |
| Dashboard Administrativo | `ADMIN_ESCOLAR` | KPIs (total de alunos, frequência média, faltas hoje, comunicados), tabela "Atenção necessária", feed "Atividades recentes" |
| Dashboard (professor) | `PROFESSOR` | Saudação, lista de aulas do dia, atalhos (lançar notas / criar comunicado / ver turmas) |
| Gestão de Alunos - Arbora | `ADMIN_ESCOLAR`, `COORDENACAO` | Tabela com filtros (ano letivo, série, turma, status), colunas aluno/matrícula/turma/responsáveis/frequência/status |
| Perfil do Aluno - Arbora | `ADMIN_ESCOLAR`, `COORDENACAO`, `PROFESSOR` | Stats (média, frequência, alertas), responsáveis vinculados (com "autorizado a retirar"), alertas, eventos recentes |
| Realização (chamada) | `PROFESSOR` | Busca de aluno, botão "marcar todos como presentes", lista com toggle presente/falta |
| Lançamento de Notas - Arbora | `PROFESSOR` | Tabela editável nota por aluno, badges de situação (aprovado/atenção/ausente/sem nota/erro de validação), salvar rascunho / publicar |
| Comunicados - Arbora | `ADMIN_ESCOLAR`, `COORDENACAO`, `PROFESSOR` | KPIs (publicados, aguardando ciência), tabela com destinatário/autor/data/% leitura/status |
| Agenda Escolar - Arbora | Todos exceto `SUPER_ADMIN` | Calendário mensal + legenda de categorias (reunião/evento/feriado/extracurricular/prazo final) + lista de próximos eventos |
| Super-Admin Dashboard - Arbora | `SUPER_ADMIN` | KPIs (instituições ativas/em implantação/suspensas/total de alunos), tabela de instituições (plano, status, data), gráfico de volume de acessos |

Dashboard do `RESPONSAVEL` (mobile-first, 390×1202) foi visto na primeira passada mas não
reexaminado em detalhe: seletor de aluno, linha do tempo de movimentações (entrada/saída), central
de autorizações.

## Onde cada tela foi implementada

Fase 3.1 (2026-08-31) reproduziu as 10 telas como rotas reais em `apps/web/src/app/(app)/`,
com dado estático (mock) — a camada de dados real é a Fase 3.2, ainda não feita:

| Rota | Tela do protótipo |
| ---- | ------------------ |
| `/dashboard` | Dashboard — ramifica por papel (`admin-dashboard.tsx`, `professor-dashboard.tsx`, `responsavel-dashboard.tsx`) |
| `/alunos` | Gestão de Alunos |
| `/alunos/[id]` | Perfil do Aluno |
| `/chamada` | Realização (chamada) |
| `/notas` | Lançamento de Notas |
| `/comunicados` | Comunicados |
| `/agenda` | Agenda Escolar |
| `/super-admin` | Super-Admin Dashboard |

Cada página chama `requireRole` (`apps/web/src/lib/server-session.ts`) antes de renderizar —
espelha o `RolesGuard` da API no front, redirecionando para `/dashboard` quem acessa uma rota do
papel errado. `apps/web/src/components/app-shell.tsx` é a casca (menu lateral + topo) comum a
todas, com os itens de navegação filtrados pelo papel do usuário.

## Como está organizado

Tailwind CSS v4, com os tokens declarados em CSS — sem `tailwind.config.js`.

```
apps/web/src/app/globals.css
├── @theme { … }   → tokens da marca: paleta, tipografia, raios
└── :root { … }    → papéis de cor da interface (superfície, texto, borda)
```

A separação importa: **`@theme` guarda a paleta, `:root` guarda o uso dela**. Um componente
nunca referencia `--color-brand-500` para pintar um fundo; ele usa `--color-surface`. Trocar de
tema — ou implementar modo escuro, que já está no arquivo — vira trocar os papéis, sem tocar em
componente nenhum.

## Sincronizar com o protótipo

Feito: paleta exata (`#26734D`/`#174D35`/`#EAF5EF`/`#1F2933`) e tipografia (Manrope) em
`globals.css`/`layout.tsx`; as 10 telas reproduzidas com dado mock. Falta:

1. ✅ Contraste dos pares texto/fundo auditado e corrigido (Fase 3.5) — ver
   [Acessibilidade](#acessibilidade).
2. ✅ Camada de dados real (Fase 3.2) — as 10 telas chamam a API de verdade.
3. Dashboard do responsável (mobile) não foi reexaminado em detalhe — a versão implementada é uma
   composição razoável a partir da descrição textual do protótipo, não de pixel.

## Componentes

`apps/web/src/components/`: `AppShell` (casca autenticada), `StatCard` (cartão de indicador),
`StatusBadge` (pílula colorida de status), `LogoutButton`. Ícones vêm de `lucide-react` (mesmo
estilo dos ícones do protótipo).

Ainda vale reavaliar a introdução de uma base de componentes (shadcn/ui sobre Radix) para
diálogos, menus e comboboxes — nenhuma tela implementada até agora precisou de um desses, mas
formulários mais complexos (Fase 3.2/3.3) provavelmente vão precisar.

Enquanto houver um único app consumidor, os componentes ficam em `apps/web`. Extrair um
`packages/ui` antes de existir um segundo consumidor só adicionaria indireção.

## Acessibilidade

Já configurado:

- `eslint-plugin-jsx-a11y` em modo recomendado, rodando no `pnpm lint`.
- `:focus-visible` com contorno visível, em `globals.css` (mais forte no tema alto contraste).
- `lang="pt-BR"` no documento.

Checklist da Fase 3.5 (revisão de acessibilidade):

- [x] **Contraste AA em todos os pares de cor com a paleta real.** Auditoria feita medindo a
      cor computada de verdade no navegador (não o valor "de olho" do protótipo) — conversão
      OKLCH → sRGB + fórmula de luminância relativa do WCAG, contraste calculado tanto contra
      `--color-surface` quanto contra o próprio badge (fundo na mesma cor a 15% de opacidade,
      que é mais exigente que a superfície pura). Pares que não batiam 4.5:1 tiveram
      `--color-danger`, `--color-success` e `--color-warning` recalibrados (valores diferentes
      por tema — dark precisa de um verde/vermelho mais claro que o light pra a mesma
      legibilidade) e ganharam um `--color-link` novo (`text-[var(--color-brand-600)]` como
      link direto sobre `--color-surface` não passava em dark; como fundo de botão continua
      brand-600 normalmente, porque texto branco em cima já contrasta bem).
- [x] **Navegação completa por teclado, sem armadilha de foco.** Não precisou de trabalho novo:
      toda a interface usa elementos nativos (`button`, `select`, `input`, `<dialog>` +
      `showModal()`, `Link`) — nenhum `<div onClick>` sem equivalente de teclado. `<dialog>`
      nativo já faz focus trap e fecha com Esc de graça.
- [x] **Rótulos associados a todos os campos de formulário.** A maioria já usava `<label>`
      envolvendo o campo; os que não tinham rótulo visível (busca da chamada, os `<select>` de
      turma/período/data nos filtros, a nota por aluno em `notas-form.tsx`) ganharam
      `aria-label`.
- [x] **Erros de formulário anunciados por leitores de tela.** `role="alert"` em toda mensagem
      de erro de formulário (os 3 diálogos/forms de escrita da Fase 3.3 e o `error.tsx` da
      Fase 3.4) — mesmo padrão que a tela de login já usava desde a Fase 2.
- [x] Nenhuma informação transmitida **apenas** por cor — os badges de status usam cor + texto.

### Temas: claro, escuro e alto contraste

`ThemeToggle` (`apps/web/src/components/theme-toggle.tsx`, no rodapé do menu lateral) deixa
escolher entre Automático (segue `prefers-color-scheme`, o padrão), Claro, Escuro e Alto
contraste. A escolha vai pro `localStorage` (`arbora-theme`) e vira o atributo `data-theme` em
`<html>`; um script inline em `apps/web/src/app/layout.tsx` aplica esse atributo antes da
primeira pintura pra não piscar o tema errado.

`data-theme='high-contrast'` não é só o tema claro com mais contraste — cada cor de texto foi
recalculada pra bater **AAA (≥7:1)**, não só AA, incluindo contra o próprio fundo do badge; a
borda fica bem mais visível (`oklch(0.55 0.02 249)` em vez de `oklch(0.9 0.01 249)`) e o
indicador de foco fica mais grosso. Ver os blocos `:root[data-theme='...']` em `globals.css`.
