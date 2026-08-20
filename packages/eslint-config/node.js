import globals from 'globals';

import base from './base.js';

/** Configuração para pacotes que rodam em Node.js (ex.: apps/api). */
export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'commonjs',
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      // Decorators do NestJS dependem de metadados em tempo de execução.
      '@typescript-eslint/no-extraneous-class': 'off',

      // `import type` apaga o import do JS gerado. Como a injeção de
      // dependência do Nest resolve os providers pelos metadados
      // `design:paramtypes` emitidos a partir dos tipos do construtor, um
      // import type-only de um provider quebra a DI em tempo de execução —
      // e o autofix desta regra fazia exatamente isso.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
