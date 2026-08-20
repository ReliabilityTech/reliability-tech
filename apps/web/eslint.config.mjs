import react from '@arbora/eslint-config/react';

export default [
  ...react,
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
];
