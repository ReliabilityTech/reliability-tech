/**
 * Conventional Commits — ver docs/convencoes.md
 * Escopos sugeridos: api, web, contracts, docs, infra, ci, deps
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
