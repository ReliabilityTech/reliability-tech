import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Sem isso o glob padrão do Vitest também casa com e2e/*.spec.ts —
    // são specs do Playwright, que tem seu próprio test runner (test:e2e).
    exclude: ['**/node_modules/**', 'e2e/**'],
  },
});
