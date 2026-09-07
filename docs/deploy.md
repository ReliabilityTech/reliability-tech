# Deploy — Fly.io

> Este documento não foi validado contra uma conta Fly real (a sessão que
> escreveu isso não tem credencial de Fly.io) — os comandos seguem a
> documentação oficial do Fly, mas rode cada etapa manualmente e confirme
> antes de confiar no pipeline automatizado (`.github/workflows/deploy.yml`).
> Se algum nome de app já estiver em uso (nomes são globais no Fly), troque
> o campo `app` no `fly.toml` correspondente antes de continuar.

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
`release_command` do `fly.toml` (a migração) e a API em produção usam, sem
precisar declarar credencial nenhuma em lugar nenhum do repo.

```bash
fly postgres attach reliability-tech-db-staging -a reliability-tech-api-staging
fly postgres attach reliability-tech-db-production -a reliability-tech-api
```

## 4. Segredos que não vêm do Postgres

```bash
# Gere um valor por ambiente — nunca reuse o mesmo JWT_SECRET entre staging e produção.
fly secrets set JWT_SECRET="$(openssl rand -base64 48)" -a reliability-tech-api-staging
fly secrets set JWT_SECRET="$(openssl rand -base64 48)" -a reliability-tech-api

# Aponta pro app web real de cada ambiente (CORS) — troque pelo domínio
# customizado se/quando existir um.
fly secrets set CORS_ORIGINS=https://reliability-tech-web-staging.fly.dev -a reliability-tech-api-staging
fly secrets set CORS_ORIGINS=https://reliability-tech-web.fly.dev -a reliability-tech-api
```

## 5. Testar manualmente antes de confiar no pipeline

```bash
docker build -f apps/api/Dockerfile -t reliability-tech-api-test .
fly deploy --config apps/api/fly.staging.toml --local-only -i reliability-tech-api-test
```

Confirma em `fly logs -a reliability-tech-api-staging` que a migração
(`release_command`) rodou sem erro e que `fly status -a
reliability-tech-api-staging` mostra a máquina saudável antes de repetir pro
web e pra produção.

## 6. Ligar o pipeline automatizado (`.github/workflows/deploy.yml`)

Um token por ambiente, escopado só àquela app (não à organização inteira):

```bash
fly tokens create deploy -a reliability-tech-api-staging
fly tokens create deploy -a reliability-tech-api
```

No GitHub: **Settings → Environments**, crie `staging` e `production`. Em
cada um:

- **Secret** `FLY_API_TOKEN` — o token gerado acima para aquele ambiente.
- **Variable** `NEXT_PUBLIC_API_URL` — a URL pública da API daquele
  ambiente + `/api/v1` (ex.: `https://reliability-tech-api-staging.fly.dev/api/v1`).
  Precisa ser variável (não secret): é inlinada no bundle do front em build
  time, não lida em runtime — ver comentário em `apps/web/Dockerfile`.

Com isso configurado, **Actions → Deploy → Run workflow** builda, publica no
GHCR e faz o `flyctl deploy` dos dois apps do ambiente escolhido.
