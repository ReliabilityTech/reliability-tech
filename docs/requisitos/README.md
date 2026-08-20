# Requisitos do Arbora

> ⚠️ **Estes documentos estão vazios de conteúdo real.**
>
> O levantamento de requisitos vive em uma página privada do Notion
> (`Requisitos Funcionais e Não-funcionais – Arbora`) que **não pôde ser lida automaticamente**:
> a página exige autenticação e o domínio está bloqueado pela política de rede do ambiente.
>
> A estrutura, a numeração e os campos abaixo já estão prontos. Falta **colar o conteúdo**.

## Por que manter os requisitos no repositório

O Notion continua sendo o lugar da discussão. O repositório passa a ser o lugar do **estado
acordado**, por três motivos:

1. **Versionamento.** Um requisito que muda vira um diff revisável, com autor e data.
2. **Rastreabilidade.** Cada requisito recebe um código estável (`RF-001`) que é citado em
   commits, PRs e testes — dá para responder "este código atende a qual requisito?".
3. **Disponibilidade.** Quem trabalha no código não depende de acesso a uma ferramenta externa.

## Arquivos

| Arquivo | Conteúdo |
| ------- | -------- |
| [`funcionais.md`](funcionais.md) | o que o sistema faz (RF) |
| [`nao-funcionais.md`](nao-funcionais.md) | com que qualidade ele faz (RNF) |
| [`glossario.md`](glossario.md) | linguagem ubíqua do domínio |
| [`rastreabilidade.md`](rastreabilidade.md) | requisito → código → teste |

## Convenção de códigos

| Prefixo | Significado          | Exemplo  |
| ------- | -------------------- | -------- |
| `RF`    | requisito funcional  | `RF-001` |
| `RNF`   | requisito não-funcional | `RNF-001` |
| `RN`    | regra de negócio     | `RN-001` |

Códigos **nunca são reutilizados**. Um requisito removido vira `Cancelado`, mantendo o número.

## Como importar do Notion

1. No Notion: `···` → `Exportar` → formato **Markdown**.
2. Cole o conteúdo nos arquivos correspondentes, ajustando ao formato de tabela já existente.
3. Preencha a coluna **Prioridade** usando MoSCoW (`Must`, `Should`, `Could`, `Won't`).
4. Atualize `rastreabilidade.md` conforme cada requisito for implementado.
5. Revise o [ADR 0004](../adr/0004-autenticacao-e-papeis.md): ele contém hipóteses sobre perfis
   de acesso que os requisitos devem confirmar ou corrigir.
