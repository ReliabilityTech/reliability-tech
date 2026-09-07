import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      // Piso é o valor atual (ver docs/roadmap.md Fase 4.3) — trava regressão,
      // não persegue 100%: branch/func baixos aqui são estrutural (a maioria
      // dos arquivos é schema Zod declarativo, sem branch pra cobrir).
      thresholds: { statements: 82, branches: 15, functions: 15, lines: 82 },
    },
  },
});
