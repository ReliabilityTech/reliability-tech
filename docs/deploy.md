# Deploy — Fly.io

> **Staging validada contra uma conta Fly real em 2026-11-25** (Postgres, API e
> web em `gru`, deploy pelo `deploy.yml`, login ponta a ponta). **Produção
> ainda não** — os comandos de produção seguem a documentação oficial do Fly,
> mas rode cada etapa manualmente e confirme antes de confiar no pipeline.
> Se algum nome de app já estiver em uso (nomes são globais no Fly), troque
> o campo `app` no `fly.toml` correspondente antes de continuar.
>
> Limite que condiciona o desenho: o plano usado tem teto de **3 machines** (Postgres +
> API + web). Por isso não há `release_command` (ele sobe uma machine extra) e os
> deploys usam `--ha=false`. Produção (3 apps novos) exige aumentar o limite.

Cobre a Fase 5.3 do roadmap: dois ambientes (staging e produção), cada um com
sua própria API, seu próprio web e seu próprio Postgres — isolados de
verdade, não só uma flag de ambiente no mesmo banco.

## Uma vez só, por máquina de quem for provisionar

```bash
curl -L https://fly.io/install.sh | sh   # ou https://fly.io/install.ps1 no PowerShell
fly auth login
```

## 1. Postgres — um cluster por ambiente

```bash
fly postgres create --name reliability-tech-db-staging --region gru --vm-size shared-cpu-1x --volume-size 3
fly postgres create --name reliability-tech-db-production --region gru --vm-size shared-cpu-1x --volume-size 10
```

## 2. Os 4 apps (API e web, staging e produção)

Os `fly.toml`/`fly.staging.toml` em `apps/api/` e `apps/web/` já têm `app`,
região e healthcheck definidos — `fly launch` a partir de cada um sem deixar
o Fly reescrever a config:

```bash
fly launch --config apps/api/fly.toml --no-deploy --copy-config
fly launch --config apps/api/fly.staging.toml --no-deploy --copy-config
fly launch --config apps/web/fly.toml --no-deploy --copy-config
fly launch --config apps/web/fly.staging.toml --no-deploy --copy-config
```

`--no-deploy` porque ainda não tem imagem publicada nem banco conectado —
o primeiro deploy de verdade vem do pipeline (ou de um `flyctl deploy` manual
mais abaixo), depois dos passos 3 e 4.

## 3. Ligar cada API no seu Postgres

`fly postgres attach` cria um usuário/banco dedicado e grava o secret
`DATABASE_URL` direto na app de API — é esse mesmo secret que o
passo de migração do `deploy.yml` (`prisma migrate deploy` via `flyctl ssh console`) e a API em produção usam, sem
precisar declarar credencial nenhuma em lugar nenhum do repo.

```bash
fly postgres attach reliability-tech-db-staging -a reliability-tech-api-staging
fly postgres attach reliability-tech-db-production -a reliability-tech-api
```

## 4. Papel restrito pra API — RLS de verdade (roadmap 6.2)

O papel que `fly postgres attach` grava em `DATABASE_URL` é quem roda a migração — não dá pra
saber de antemão se esse papel também ignora RLS por completo (Postgres sempre ignora RLS pra
superusuário, sem exceção), então a API roda com um papel próprio, restrito, separado — mesmo
padrão do `backup_reader` da Fase 5.5.

```bash
fly postgres connect -a reliability-tech-db-production
```

Dentro do `psql` (o `CREATE ROLE arbora_app NOLOGIN` já veio da migração
`20260907165617_rls_tenant_isolation` — só falta dar login):

```sql
ALTER ROLE arbora_app WITH LOGIN PASSWORD 'troque-por-um-valor-gerado' NOSUPERUSER;
```

Repita pra `-staging`. Depois, `fly secrets set` com o mesmo host/porta/banco de `DATABASE_URL`,
só trocando usuário/senha:

```bash
fly secrets set APP_DATABASE_URL="postgresql://arbora_app:<senha-gerada>@<mesmo-host-do-DATABASE_URL>/<mesmo-banco>" -a reliability-tech-api-staging
fly secrets set APP_DATABASE_URL="postgresql://arbora_app:<senha-gerada>@<mesmo-host-do-DATABASE_URL>/<mesmo-banco>" -a reliability-tech-api
```

`fly postgres db list -a reliability-tech-db-production` (mesmo comando já usado em
[backup.md](backup.md)) confirma o nome do host/banco. **Sem isso, a API não sobe** — `env.ts`
exige `APP_DATABASE_URL`.

## 5. Segredos que não vêm do Postgres

```bash
# Gere um valor por ambiente — nunca reuse o mesmo JWT_SECRET entre staging e produção.
fly secrets set JWT_SECRET="$(openssl rand -base64 48)" -a reliability-tech-api-staging
fly secrets set JWT_SECRET="$(openssl rand -base64 48)" -a reliability-tech-api

# Aponta pro app web real de cada ambiente (CORS) — troque pelo domínio
# customizado se/quando existir um.
fly secrets set CORS_ORIGINS=https://reliability-tech-web-staging.fly.dev -a reliability-tech-api-staging
fly secrets set CORS_ORIGINS=https://reliability-tech-web.fly.dev -a reliability-tech-api
```

## IP do cliente e rate limit (`TRUST_PROXY_HOPS`)

O rate limit da API é por IP (`req.ip`). Atrás do proxy do Fly, sem
`TRUST_PROXY_HOPS` o Express usa o IP do vizinho direto da conexão, e como o web
repassa as chamadas do navegador à API (proxy do Next), todo mundo pareceria um
só cliente (limite de 120 req/min dividido entre todos os usuários).

O web também repassa o `X-Forwarded-For` original nas chamadas que o servidor dele
faz à API (middleware e Server Components, `forwardClientIp` em
`apps/web/src/lib/api-base.ts`), para que elas contem no limite de quem navega e
não todas no IP da machine do web. Medido em staging: cadeia de 4 saltos.

`TRUST_PROXY_HOPS=N` faz o Express ler o IP do cliente do `N`-ésimo item de
`X-Forwarded-For`, contando da direita. **Contar a mais** deixa o cliente forjar
o IP; **a menos** devolve o IP de um proxy. Como calibrar: faça uma requisição
pelo navegador (ex.: um login), pegue o `x-forwarded-for` dela em
`fly logs -a reliability-tech-api-staging --no-tail` e conte quantos itens há à
direita do IP real do cliente (o Fly adiciona o seu próprio no fim). Depois:

```bash
fly secrets set TRUST_PROXY_HOPS=<N> -a reliability-tech-api-staging
```

## 6. Sentry — monitoramento de erros (opcional, Fase 5.4)

Sem isso configurado, os dois apps sobem normalmente com Sentry desligado
(`env.ts`/`lib/env.ts` tratam DSN ausente/vazio como "sem Sentry", ver
comentário em `apps/api/src/instrument.ts` e `apps/web/src/instrumentation.ts`).
Configurar é opcional, mas recomendado antes de confiar em produção sem
visibilidade de erro nenhuma.

```bash
# sentry.io → criar organização (se não tiver) → criar projeto Node (API) e
# um projeto Next.js (web). Cada projeto tem seu próprio DSN em
# Settings → Projects → <projeto> → Client Keys (DSN).

fly secrets set SENTRY_DSN=https://...@o0.ingest.sentry.io/... -a reliability-tech-api-staging
fly secrets set SENTRY_DSN=https://...@o0.ingest.sentry.io/... -a reliability-tech-api
```

No GitHub, nos mesmos ambientes `staging`/`production` criados no passo 8:

- **Variable** `NEXT_PUBLIC_SENTRY_DSN` — o DSN do projeto Next.js (é
  inlinado no bundle do front, por isso variável pública, não secret — mesmo
  raciocínio de `NEXT_PUBLIC_API_URL`).
- **Variable** `SENTRY_ORG` e `SENTRY_PROJECT` — slugs do projeto Next.js
  (usados só pra decidir se faz upload de sourcemap, não são segredo).
- **Secret** `SENTRY_AUTH_TOKEN` — token com permissão de escrita
  (Settings → Auth Tokens, escopo `project:releases`), usado só durante o
  build pra subir sourcemap. Nunca vira `ARG`/`ENV` de imagem Docker —
  `apps/web/Dockerfile` monta como BuildKit secret (`--mount=type=secret`),
  que não persiste em camada nenhuma; sem esse secret o build segue normal,
  só pula o upload de sourcemap.

A API não precisa de `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` —
`@sentry/nestjs` não faz upload de sourcemap neste projeto, só captura erro
em runtime a partir do `SENTRY_DSN`.

Ver [monitoring.md](monitoring.md) para o alerta de uptime sobre `/health`.

Ver [backup.md](backup.md) para o bucket Tigris, o papel Postgres só-leitura e os segredos do
backup automatizado (Fase 5.5) — provisionamento independente deste, pode ser feito em qualquer
ordem.

## 7. Testar manualmente antes de confiar no pipeline

```bash
docker build -f apps/api/Dockerfile -t reliability-tech-api-test .
fly deploy --config apps/api/fly.staging.toml --local-only -i reliability-tech-api-test
```

Confirma em `fly logs -a reliability-tech-api-staging` que a migração
(rode `fly ssh console -a reliability-tech-api-staging -C "apps/api/node_modules/.bin/prisma migrate deploy --schema apps/api/prisma/schema.prisma"`) rodou sem erro e que `fly status -a
reliability-tech-api-staging` mostra a máquina saudável antes de repetir pro
web e pra produção.

## 8. Ligar o pipeline automatizado (`.github/workflows/deploy.yml`)

Um token por ambiente, escopado só àquela app (não à organização inteira):

```bash
fly tokens create deploy -a reliability-tech-api-staging
fly tokens create deploy -a reliability-tech-api
```

No GitHub: **Settings → Environments**, crie `staging` e `production`. Em
cada um:

- **Secret** `FLY_API_TOKEN` — o token gerado acima para aquele ambiente.

Não há variável de URL da API: o web chama `/api/v1` no próprio host e o Next
repassa à API (`rewrites` em `next.config.ts`, origem em `API_ORIGIN`, derivada
do nome do app no `fly.toml` da API). Motivo: web e API em `*.fly.dev` são sites
diferentes e o cookie de sessão (httpOnly, sem `Domain`) não cruza entre eles.
Com domínio próprio (`app.x.com` + `api.x.com`) daria pra voltar a uma URL
absoluta e `Domain=.x.com` no cookie.

Com isso configurado, **Actions → Deploy → Run workflow** faz o `flyctl deploy
--remote-only` dos dois apps do ambiente escolhido (o build roda no builder do Fly, sem GHCR).
