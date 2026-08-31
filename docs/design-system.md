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

1. Confirmar contraste dos pares texto/fundo com o verde real — mínimo **4.5:1** para texto
   normal e **3:1** para texto grande (WCAG 2.1 AA). Não verificado ainda.
2. Camada de dados real (roadmap Fase 3.2) — hoje cada tela usa um array estático no topo do
   arquivo, claramente marcado, no lugar de chamar a API.
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
- `:focus-visible` com contorno visível, em `globals.css`.
- `lang="pt-BR"` no documento.

A cumprir:

- [ ] Contraste AA em todos os pares de cor com a paleta real.
- [ ] Navegação completa por teclado, sem armadilha de foco.
- [ ] Rótulos associados a todos os campos de formulário.
- [ ] Erros de formulário anunciados por leitores de tela (`aria-live`).
- [ ] Nenhuma informação transmitida **apenas** por cor (os badges de status hoje só usam cor +
      texto, o que já atende, mas revisar ao evoluir).
