import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Sem o plugin, o esbuild do Vite cai no transform clássico de JSX (exige
  // `React` no escopo) em vez do automatic runtime que o Next 15 usa —
  // qualquer teste de componente falha com "React is not defined".
  plugins: [react()],
  // Espelha o path alias de tsconfig.json (@/* -> ./src/*) — Vitest não lê
  // tsconfig "paths" sozinho, só resolve.alias do Vite.
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    // Sem isso o glob padrão do Vitest também casa com e2e/*.spec.ts —
    // são specs do Playwright, que tem seu próprio test runner (test:e2e).
    exclude: ['**/node_modules/**', 'e2e/**'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Instrumentação de cobertura (V8) deixa os testes de componente bem mais
    // lentos — o padrão de 5s já flakava sob --coverage; delay:null no
    // userEvent (por teste) resolve a causa raiz (timers reais de digitação
    // competindo com o overhead da instrumentação), isso aqui é só margem.
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      // src/lib (funções puras) + src/components e os arquivos client/dialog/
      // form/list de src/app (Fase 4.5): a convenção de nome do projeto pra
      // componente client-side com lógica de verdade. O resto de src/app é
      // Server Component sem estado, coberto pelo E2E (Fase 4.1), não por
      // teste de unidade — incluir tudo aqui só produziria ruído.
      include: [
        'src/lib/**/*.ts',
        'src/components/**/*.tsx',
        'src/app/**/*-{client,dialog,form,list}.tsx',
        'src/app/**/error.tsx',
      ],
      // Piso é o valor atual (ver docs/roadmap.md Fase 4.3/4.5): trava regressão.
      thresholds: { statements: 50, branches: 80, functions: 65, lines: 50 },
    },
  },
});
