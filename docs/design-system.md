# Design system

## Estado atual

> ⚠️ Os tokens em `apps/web/src/app/globals.css` são **provisórios**. Eles ainda não foram
> extraídos do protótipo do Stitch — a URL do protótipo exige autenticação e está bloqueada pela
> política de rede do ambiente, então os valores atuais são um ponto de partida coerente com o
> nome do produto (arbor → verde), não o design real.

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

1. No Stitch, abra o painel de estilos do projeto.
2. Substitua **apenas** os valores dentro de `@theme` e `:root` em `globals.css`.
3. Verifique o contraste dos pares texto/fundo — mínimo **4.5:1** para texto normal e **3:1**
   para texto grande (WCAG 2.1 AA).
4. Rode `pnpm --filter @arbora/web dev` e confira as duas preferências de tema (claro e escuro).

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
