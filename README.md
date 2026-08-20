# Arbora

Plataforma **Arbora**, da Reliability Tech. Este repositório é um monorepo TypeScript com a
aplicação web, a API e os contratos compartilhados entre elas.

> **Estado atual:** fundação técnica pronta e validada (build, lint, testes e CI passando).
> O domínio de negócio ainda **não** foi modelado — depende da importação dos requisitos.
> Veja [o que falta](#o-que-ainda-falta).

## Sumário

- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Começando](#começando)
- [Scripts](#scripts)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Documentação](#documentação)
- [O que ainda falta](#o-que-ainda-falta)

## Arquitetura

```
┌──────────────┐        HTTP/JSON        ┌──────────────┐        SQL        ┌────────────┐
│  apps/web    │ ──────────────────────▶ │  apps/api    │ ────────────────▶ │ PostgreSQL │
│  Next.js 15  │                         │  NestJS 11   │                   │     17     │
└──────┬───────┘                         └──────┬───────┘                   └────────────┘
       │                                        │
       └──────────┬─────────────────────────────┘
                  ▼
        packages/contracts (Zod)
     mesma validação nos dois lados
```

Detalhes e o racional de cada escolha em [`docs/arquitetura.md`](docs/arquitetura.md) e nos
[ADRs](docs/adr/).

## Pré-requisitos

| Ferramenta | Versão   | Observação                          |
| ---------- | -------- | ----------------------------------- |
| Node.js    | 22 LTS   | use `nvm use` (há um `.nvmrc`)      |
| pnpm       | 10+      | `corepack enable && corepack prepare pnpm@latest --activate` |
| Docker     | 24+      | apenas para o PostgreSQL local      |

## Começando

```bash
# 1. Dependências
pnpm install

# 2. Variáveis de ambiente
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Banco de dados local
pnpm infra:up
pnpm db:migrate      # cria o schema
pnpm db:seed         # usuário admin de desenvolvimento

# 4. Subir tudo (web em :3000, API em :3333)
pnpm dev
```

Endereços úteis:

| Serviço            | URL                                |
| ------------------ | ---------------------------------- |
| Web                | http://localhost:3000              |
| API                | http://localhost:3333/api/v1       |
| OpenAPI (Swagger)  | http://localhost:3333/api/docs     |
| Health check       | http://localhost:3333/api/v1/health |

## Scripts

Todos rodam a partir da raiz e são orquestrados pelo Turborepo.

| Comando            | O que faz                                                       |
| ------------------ | --------------------------------------------------------------- |
| `pnpm dev`         | sobe web e API em modo watch                                     |
| `pnpm build`       | build de produção de todos os pacotes                            |
| `pnpm lint`        | ESLint em todo o monorepo                                        |
| `pnpm typecheck`   | `tsc --noEmit` em todos os pacotes                               |
| `pnpm test`        | testes unitários (Jest na API, Vitest no restante)               |
| `pnpm format`      | aplica o Prettier                                                |
| `pnpm check`       | **o mesmo que o CI roda** — format, lint, typecheck e testes     |
| `pnpm infra:up`    | sobe o PostgreSQL via Docker Compose                             |
| `pnpm infra:reset` | apaga o volume do banco e sobe de novo                           |
| `pnpm db:migrate`  | aplica migrações do Prisma                                       |
| `pnpm db:studio`   | abre o Prisma Studio                                             |

Para rodar em um pacote específico: `pnpm --filter @arbora/api test`.

## Estrutura de pastas

```
.
├── apps/
│   ├── api/                 # NestJS 11 — API HTTP
│   │   ├── prisma/          # schema, migrações e seed
│   │   └── src/
│   │       ├── common/      # filtros, pipes e utilitários transversais
│   │       ├── config/      # validação das variáveis de ambiente
│   │       ├── health/      # health e liveness checks
│   │       └── prisma/      # PrismaService (módulo global)
│   └── web/                 # Next.js 15 — App Router
│       └── src/
│           ├── app/         # rotas, layout e design tokens
│           ├── components/  # componentes de UI
│           └── lib/         # cliente de API tipado e configuração
├── packages/
│   ├── contracts/           # schemas Zod + tipos compartilhados
│   ├── eslint-config/       # configuração ESLint compartilhada
│   └── tsconfig/            # presets de TypeScript
├── docs/                    # arquitetura, ADRs, requisitos e convenções
└── infra/                   # docker-compose do ambiente local
```

## Documentação

| Documento | Conteúdo |
| --------- | -------- |
| [`docs/arquitetura.md`](docs/arquitetura.md) | visão geral, camadas e fluxo de dados |
| [`docs/adr/`](docs/adr/) | decisões arquiteturais e seus motivos |
| [`docs/requisitos/`](docs/requisitos/) | RFs, RNFs, glossário e matriz de rastreabilidade |
| [`docs/convencoes.md`](docs/convencoes.md) | commits, branches, nomenclatura e code review |
| [`docs/design-system.md`](docs/design-system.md) | tokens de design e sincronização com o protótipo |
| [`docs/roadmap.md`](docs/roadmap.md) | próximos passos, priorizados |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | como contribuir |

## O que ainda falta

Estes itens ficaram **bloqueados** e precisam de uma ação humana antes de seguirem:

1. **Importar os requisitos** do Notion para `docs/requisitos/funcionais.md` e
   `nao-funcionais.md` (a página é privada e não pôde ser lida automaticamente).
2. **Extrair os tokens do protótipo** do Stitch para `apps/web/src/app/globals.css`
   (cores, tipografia, espaçamentos) — os valores atuais são provisórios.
3. **Modelar o domínio** em `apps/api/prisma/schema.prisma` — hoje só existem `User` e
   `AuditLog`.
4. **Implementar a autenticação** de fato — o contrato existe em
   `packages/contracts/src/auth.ts`, a implementação não.

O detalhamento e a ordem sugerida estão em [`docs/roadmap.md`](docs/roadmap.md).
