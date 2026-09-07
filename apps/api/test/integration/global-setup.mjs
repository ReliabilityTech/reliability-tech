// Roda uma vez, no processo principal do Jest (não num worker) — por isso dá
// pra guardar o container em `globalThis` e recuperá-lo no global-teardown no
// mesmo processo. .mjs porque Jest não passa globalSetup pelo transform do
// ts-jest, e o eslint do projeto proíbe `require()` em módulo comum.
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PostgreSqlContainer } from '@testcontainers/postgresql';

const diretorioAtual = path.dirname(fileURLToPath(import.meta.url));
const API_ROOT = path.join(diretorioAtual, '..', '..');

export default async function globalSetup() {
  const container = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('arbora_test')
    .withUsername('arbora')
    .withPassword('arbora')
    .start();

  const databaseUrl = container.getConnectionUri();
  process.env.DATABASE_URL = databaseUrl;

  // Migrações de verdade contra o banco efêmero — não `db push`, pra exercitar
  // os mesmos arquivos de migração que chegam em produção (ver db:deploy).
  execSync('prisma migrate deploy', {
    cwd: API_ROOT,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  globalThis.__ARBORA_PG_CONTAINER__ = container;
}
