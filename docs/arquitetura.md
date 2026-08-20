# Arquitetura

## Visão geral

O Arbora é um monorepo TypeScript com dois artefatos executáveis e um pacote de contratos.

| Pacote               | Papel                                              | Runtime      |
| -------------------- | -------------------------------------------------- | ------------ |
| `@arbora/web`        | interface do usuário                                | Next.js 15   |
| `@arbora/api`        | regras de negócio, persistência e integrações        | NestJS 11    |
| `@arbora/contracts`  | schemas Zod e tipos usados pelos dois lados          | biblioteca   |

A separação entre web e API é deliberada: permite que outros clientes (app móvel, integrações
de clientes, coletores de dados de campo) consumam a mesma API sem reescrever regra de negócio.
Ver [ADR 0002](adr/0002-stack-nextjs-nestjs.md).

## Fluxo de uma requisição

```
Browser
  │  (1) ação do usuário
  ▼
apps/web — Server ou Client Component
  │  (2) apiFetch(path, { schema })      src/lib/api-client.ts
  ▼
apps/api — Controller
  │  (3) ZodValidationPipe valida o corpo com o schema de @arbora/contracts
  ▼
Service (regra de negócio)
  │  (4) PrismaService
  ▼
PostgreSQL
```

Na volta, qualquer exceção passa pelo `AllExceptionsFilter`, que a converte no envelope
`ApiError`. O `apiFetch` reconhece esse envelope e lança `ApiRequestError`, então o front trata
todos os erros de um jeito só.

## Decisões estruturais

### Contratos compartilhados

`@arbora/contracts` é a única fonte da verdade sobre o formato dos dados. Um schema Zod serve
simultaneamente como:

- validação de entrada na API (`ZodValidationPipe`);
- validação de resposta no front (`apiFetch`);
- tipo TypeScript nos dois lados (`z.infer`).

Isso elimina a classe de bug em que o front e a API discordam silenciosamente sobre um campo.

### Camadas da API

```
Controller   → HTTP: rotas, status codes, documentação OpenAPI. Sem regra de negócio.
Service      → regra de negócio. Não conhece Express nem HTTP.
PrismaService → acesso a dados.
```

Módulos transversais ficam em `src/common/` (filtros, pipes, interceptors) e em `src/config/`.

### Configuração

Nenhuma variável de ambiente é lida com `process.env` espalhado pelo código. Tudo passa por
`src/config/env.ts`, validado com Zod no boot — a aplicação **não sobe** com configuração
inválida, em vez de falhar mais tarde em produção.

### Versionamento da API

As rotas são servidas em `/api/v1/...` via `enableVersioning` do Nest. Mudanças incompatíveis
entram como `v2` sem quebrar clientes existentes.

### Observabilidade

- Logs estruturados em JSON (`nestjs-pino`), com `requestId` correlacionando log e resposta.
- Campos sensíveis (`authorization`, `cookie`, `password`) são redigidos antes de sair no log.
- `/health` agrega o estado das dependências; `/health/live` responde sem tocar no banco, para
  que uma queda do PostgreSQL não provoque reinício do container.

### Segurança (baseline já implementado)

| Controle             | Onde                                        |
| -------------------- | ------------------------------------------- |
| Cabeçalhos seguros   | `helmet()` na API, `headers()` no Next       |
| CORS restrito        | `CORS_ORIGINS`, sem curinga                  |
| Rate limit global    | `@nestjs/throttler`                          |
| Erros sem vazamento  | `AllExceptionsFilter` não expõe stack traces |
| Segredos fora do git | `.env` ignorado; só `.env.example` versionado |

## Limites conhecidos

Estes pontos são deliberadamente simples até que os requisitos sejam consolidados:

- **Domínio não modelado.** O Prisma só tem `User` e `AuditLog`.
- **Autenticação não implementada.** Existe o contrato, não o fluxo.
- **Sem pipeline de deploy.** Não há Dockerfile de produção nem ambiente provisionado.
- **Sem testes E2E.** Só testes unitários. Playwright está no roadmap.
