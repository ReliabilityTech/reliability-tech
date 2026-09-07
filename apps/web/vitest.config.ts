import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Sem isso o glob padrão do Vitest também casa com e2e/*.spec.ts —
    // são specs do Playwright, que tem seu próprio test runner (test:e2e).
    exclude: ['**/node_modules/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      // Só src/lib: src/app e src/components são componentes React sem infra
      // de teste ainda (Fase 4.5, Vitest + Testing Library, ainda não
      // iniciada) — hoje são cobertos pelo E2E (Fase 4.1), não por teste de
      // unidade. Incluir esses diretórios aqui só produziria um número quase
      // zero e sem ação possível até a Fase 4.5 existir.
      include: ['src/lib/**/*.ts'],
      // Piso é o valor atual (ver docs/roadmap.md Fase 4.3): trava regressão.
      thresholds: { statements: 15, branches: 50, functions: 30, lines: 15 },
    },
  },
});
