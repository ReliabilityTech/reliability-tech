// Carregado por src/instrumentation.ts (runtime edge — middleware.ts, que
// roda em edge por padrão no App Router). Ver sentry.client.config.ts sobre
// ler process.env direto.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
