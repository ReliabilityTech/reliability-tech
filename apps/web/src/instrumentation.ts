import * as Sentry from '@sentry/nextjs';

/** Convenção do Next (App Router): roda uma vez, por runtime, antes de tudo. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

/** Captura erro de Server Component/Route Handler que o error.tsx não vê. */
export const onRequestError = Sentry.captureRequestError;
