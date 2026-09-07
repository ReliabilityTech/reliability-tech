// Precisa ser o primeiro import de toda a aplicação (main.ts importa este
// arquivo antes de qualquer outra coisa, inclusive reflect-metadata) — o SDK
// do Sentry instrumenta módulos nativos (http, etc.) na própria importação,
// e isso só funciona se rodar antes de tudo mais carregar.
//
// Por isso lê `process.env.SENTRY_DSN` direto, fora do `validateEnv()` de
// config/env.ts (RNF exceção à regra "nenhum process.env solto"): o
// ConfigModule do Nest ainda nem existe nesse ponto do boot. SENTRY_DSN
// segue declarado em env.ts mesmo assim, pro resto do código conseguir
// checar "o monitoramento está ligado?" de forma validada.
import * as Sentry from '@sentry/nestjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    // Amostragem baixa: é uma API CRUD comum, não precisa de trace em toda
    // requisição pra ter visibilidade útil de erro/latência.
    tracesSampleRate: 0.1,
  });
}
