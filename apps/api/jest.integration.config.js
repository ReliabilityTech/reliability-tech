/**
 * Config separada da unitária (package.json#jest): testes de integração sobem
 * um Postgres efêmero via Testcontainers (globalSetup/globalTeardown) e usam
 * o PrismaService de verdade — não fazem parte de `pnpm test` (rápido,
 * mockado) nem de `pnpm check`, porque exigem Docker.
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.integration-spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  globalSetup: '<rootDir>/test/integration/global-setup.mjs',
  globalTeardown: '<rootDir>/test/integration/global-teardown.mjs',
  // Um container só, testes em sequência: mais simples que coordenar reset de
  // estado entre workers paralelos batendo no mesmo banco.
  maxWorkers: 1,
  testTimeout: 60_000,
};
