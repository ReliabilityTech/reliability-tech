import { defineConfig, devices } from '@playwright/test';

/**
 * Pressupõe `pnpm infra:up` já rodando (Postgres) — o `globalSetup` reresseta
 * e resemeia o banco, mas não sobe o container. `webServer` sobe API e web;
 * `reuseExistingServer` fora do CI evita reiniciar quem já estiver no ar.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html']],
  globalSetup: './e2e/global-setup.ts',
  // next dev compila cada rota sob demanda no primeiro acesso — já vimos
  // navegações de >15s no primeiro hit em dev (pior ainda com um redirect
  // duplo, como / -> /dashboard -> /super-admin). 5s (padrão) não chega perto.
  // timeout de teste (não só de assertion) mais folgado: o setup de login é
  // o primeiro hit em cada rota depois de um boot a frio do webServer, e
  // compilação + primeira query Prisma juntas já estouraram 30s numa run real.
  timeout: 90_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 30_000,
    actionTimeout: 30_000,
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @arbora/api dev',
      url: 'http://localhost:3333/api/v1/health',
      reuseExistingServer: !process.env.CI,
      // Boot a frio de Nest + Next em paralelo pode passar de 1min neste ambiente.
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @arbora/web dev',
      url: 'http://localhost:3000/login',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
