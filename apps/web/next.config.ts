import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Necessário no monorepo: o Next precisa rastrear arquivos fora de apps/web.
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  // Gera um bundle enxuto para container (ver roadmap: pipeline de deploy).
  output: 'standalone',
  poweredByHeader: false,
  eslint: {
    // O lint roda como etapa própria no CI (`pnpm lint`), não dentro do build.
    ignoreDuringBuilds: true,
  },
  // Em staging/produção o navegador chama `NEXT_PUBLIC_API_URL=/api/v1` no próprio
  // host do web e o Next repassa à API (`API_ORIGIN`): web e API em `*.fly.dev`
  // são sites diferentes, então o cookie de sessão não cruzaria entre os dois.
  // Avaliado em build time — por isso `API_ORIGIN` é build-arg (apps/web/Dockerfile).
  async rewrites() {
    const publicUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    const apiOrigin = process.env.API_ORIGIN;
    if (!publicUrl.startsWith('/') || !apiOrigin) return [];

    const prefix = publicUrl.replace(/\/+$/, '');
    return [
      {
        source: `${prefix}/:path*`,
        destination: `${apiOrigin.replace(/\/+$/, '')}${prefix}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Sem SENTRY_AUTH_TOKEN o plugin pula o upload de sourcemap sem falhar o
  // build — é assim que o build continua funcionando em dev/CI sem Sentry
  // configurado (RNF opcional, roadmap 5.4).
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  disableLogger: true,
  // Este projeto roda no Fly.io (roadmap 5.3), não na Vercel.
  automaticVercelMonitors: false,
});
