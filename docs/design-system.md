# Design system

## Estado atual

Cor de marca extraída do protótipo do Stitch ("Portal Escolar Multi-tenant") em 2026-08-30:
**verde institucional `#26734D`** — convertido para a rampa OKLCH em `globals.css` (mesmo matiz,
luminosidade/croma proporcionais ao original). Tipografia e espaçamento **não** têm uma escala
numérica própria no protótipo — ele usa uma abordagem "moderna, com espaços generosos", o que na
prática já é o comportamento padrão do Tailwind; não há token extra a copiar aqui.

> ⚠️ O protótipo é uma tela (canvas) renderizada, sem DOM acessível — não deu para abrir "inspecionar
> elemento" nem exportar CSS/hex exato por tela. O valor de marca acima veio do texto que a própria
> IA do Stitch escreveu ao descrever o projeto (painel de contexto), não de uma leitura de pixel.
> Se precisar de mais fidelidade (ex.: o hex exato de um estado de erro, ou a fonte usada), peça ao
> Victor um export/screenshot direto da tela em vez de tentar navegar o canvas de novo.

### Telas do protótipo (inventário)

10 telas foram geradas, todas em verde/branco na mesma identidade. Nomes exatos como aparecem no
Stitch, mais o que a descrição do projeto diz sobre cada uma:

| Tela | Papel(is) | O que faz (segundo a descrição do Stitch) |
| ---- | --------- | ------------------------------------------ |
| Login - Arbora | Todos | Formulário dividido: painel de marca + `e-mail ou CPF`/senha, "lembrar de mim", recuperação de senha |
| Dashboard | `ADMIN_ESCOLAR` | Indicadores críticos: frequência média, alertas de "atenção necessária" |
| Gestão (Acadêmica) | `COORDENACAO` | Gestão de alunos, perfis individuais completos, agenda escolar integrada |
| Perfil do Aluno | `COORDENACAO` / `PROFESSOR` | Foto, nome, nota em destaque, informações acadêmicas |
| Realização (de chamada?) | `PROFESSOR` | Foco em chamada e lançamento de notas — reduzir carga operacional docente |
| Dashboard (responsável, mobile-first, 390×1202) | `RESPONSAVEL` | Seletor de alunos, linha do tempo de movimentações (entrada/saída), central de autorizações |
| Lançamento (de notas) | `PROFESSOR` | Não renderizado no momento da extração |
| Comunicação | `COORDENACAO` | Recados — não renderizado no momento da extração |
| Agenda | Todos | Calendário escolar — não renderizado no momento da extração |
| Super-Admin | `SUPER_ADMIN` | Interface neutra, gerencia instituições e planos, auditoria completa |

`Login - Arbora` foi a única examinada em detalhe visual: painel verde à esquerda (logo, ilustração,
"Escola e família mais próximas."), painel branco à direita ("Acesse sua conta", campo
`e-mail ou CPF`, campo senha com alternância de visibilidade, "Lembrar de mim", "Esqueceu sua
senha?", botão verde "Entrar", contato de suporte). `Perfil do Aluno` também foi visto por alto:
cabeçalho verde, foto do aluno, nome, uma nota em destaque tipo "7.8".

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

Feito em 2026-08-30: cor de marca (`#26734D`) já está em `globals.css`. Falta:

1. Confirmar contraste dos pares texto/fundo com o verde real — mínimo **4.5:1** para texto
   normal e **3:1** para texto grande (WCAG 2.1 AA). Não verificado ainda.
2. Rodar `pnpm --filter @arbora/web dev` e conferir as duas preferências de tema (claro e escuro)
   com a cor nova.
3. Se surgir acesso mais direto ao protótipo (export, screenshot em alta resolução), revisitar a
   tabela de telas acima — hoje ela é baseada na descrição textual do Stitch, não em pixel.

Se o protótipo usar uma fonte específica, adicione-a via `next/font` em
`apps/web/src/app/layout.tsx` e aponte `--font-sans` para a variável gerada — nunca via `<link>`
para um CDN, que custa uma requisição de bloqueio no carregamento.

## Componentes

`apps/web/src/components/` tem hoje apenas `StatusCard`, usado pela página provisória.

Quando as telas do protótipo forem implementadas, vale reavaliar a introdução de uma base de
componentes (shadcn/ui sobre Radix, por exemplo) em vez de escrever cada primitivo do zero —
sobretudo pelos comportamentos de acessibilidade de diálogos, menus e comboboxes, que são caros
de acertar à mão.

Enquanto houver um único app consumidor, os componentes ficam em `apps/web`. Extrair um
`packages/ui` antes de existir um segundo consumidor só adicionaria indireção.

## Acessibilidade

Já configurado:

- `eslint-plugin-jsx-a11y` em modo recomendado, rodando no `pnpm lint`.
- `:focus-visible` com contorno visível, em `globals.css`.
- `lang="pt-BR"` no documento.

A cumprir ao implementar as telas:

- [ ] Contraste AA em todos os pares de cor.
- [ ] Navegação completa por teclado, sem armadilha de foco.
- [ ] Rótulos associados a todos os campos de formulário.
- [ ] Erros de formulário anunciados por leitores de tela (`aria-live`).
- [ ] Nenhuma informação transmitida **apenas** por cor.
