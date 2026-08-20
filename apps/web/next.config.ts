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

export default nextConfig;
