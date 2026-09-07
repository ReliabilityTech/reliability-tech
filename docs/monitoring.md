# Monitoramento — erros e uptime

> Este documento não foi validado contra uma conta Sentry real (a sessão que escreveu isso não
> tem credencial de Sentry) — os passos seguem a documentação oficial do Sentry, mas confirme cada
> etapa manualmente antes de depender do alerta em produção.

Cobre a Fase 5.4 do roadmap: captura de erro em runtime (já implementada em código) e alerta de
uptime sobre `/health` (configuração manual, fora do repo).

## Captura de erro (implementado)

`@sentry/nestjs` na API (`apps/api/src/instrument.ts`, importado como a primeira linha de
`main.ts` — o SDK precisa interceptar módulos do Node antes de qualquer outro import) e
`@sentry/nextjs` no web (`sentry.{client,server,edge}.config.ts` + `src/instrumentation.ts`).
Ambos ficam inativos sem `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` configurado — ver
[deploy.md](deploy.md#6-sentry--monitoramento-de-erros-opcional-fase-54) para provisionar.

Filtro de captura é o mesmo dos dois lados, espelhando a disciplina que já existia em
`AllExceptionsFilter`/`error.tsx` (só 5xx é "erro de verdade"):

- API (`apps/api/src/common/filters/all-exceptions.filter.ts`): `Sentry.captureException` roda no
  mesmo bloco que já loga via `Logger.error`, ou seja, só quando `statusCode >= 500`.
- Web (`apps/web/src/app/(app)/error.tsx`): `Sentry.captureException` roda quando o erro não é uma
  `ApiRequestError` (bug de verdade no client) ou quando é uma `ApiRequestError` com
  `statusCode >= 500`. Um 403/404 não é reportado — é resposta esperada da API, não falha.

Nada disso precisa de configuração adicional além do DSN: uma vez setado, todo erro 5xx real já
aparece no projeto Sentry correspondente.

## Alerta de uptime sobre `/health` (não implementado — decisão manual)

Ambos os apps de API expõem `GET /api/v1/health` publicamente (sem autenticação, ver
`apps/api/src/health/`) e é esse o endpoint que o `release_command`/healthcheck do Fly já usa
internamente (`fly.toml`). Um alerta de uptime externo é complementar: o healthcheck do Fly reinicia
a máquina se ela cair, mas não avisa ninguém — para isso, escolha uma das opções abaixo.

### Opção A — Sentry Uptime Monitoring

Se o plano/conta Sentry incluir Uptime Monitoring (recurso relativamente novo — confirme
disponibilidade no plano antes de depender dele): **Alerts → Uptime Monitors → Create Monitor**,
apontando para a URL pública de `/api/v1/health` de cada ambiente
(`https://reliability-tech-api.fly.dev/api/v1/health` e o equivalente `-staging`). Configure o
intervalo de checagem e o canal de alerta (e-mail, Slack) na própria UI do Sentry — mantém erro e
uptime no mesmo lugar, sem outra conta.

### Opção B — alternativa gratuita, se a Opção A não estiver disponível

[UptimeRobot](https://uptimerobot.com) (grátis até 50 monitores, checagem a cada 5 minutos) ou
[Healthchecks.io](https://healthchecks.io) (foco em cron/heartbeat, mas aceita HTTP monitor
também) — ambos aceitam a mesma URL pública de `/api/v1/health` como alvo e notificam por
e-mail/Slack/webhook quando o endpoint parar de responder `200`.

Qualquer uma das duas opções é configuração manual fora deste repositório — não há automação de
Infra-as-Code para isso hoje.
