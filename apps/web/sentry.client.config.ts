// Carregado pelo Sentry via withSentryConfig (next.config.ts) — roda no
// navegador. Lê direto de process.env, não de @/lib/env: o Next inlina
// NEXT_PUBLIC_* em qualquer arquivo em build time, não precisa (e não deve)
// depender da validação de outro módulo pra isso funcionar cedo.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
