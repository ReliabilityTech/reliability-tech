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
  // os mesmos arquivos de migração que chegam em produção (ver db:deploy). A
  // migração de RLS (roadmap 6.2) cria o papel `arbora_app` NOLOGIN — a senha
  // não entra em migração versionada (segredo); aqui, ambiente efêmero de
  // teste, um valor fixo não-secreto é suficiente.
  execSync('prisma migrate deploy', {
    cwd: API_ROOT,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  const senhaAppRole = 'arbora_app';
  const alterRole = await container.exec([
    'psql',
    '-U',
    'arbora',
    '-d',
    'arbora_test',
    '-c',
    `ALTER ROLE arbora_app WITH LOGIN PASSWORD '${senhaAppRole}' NOSUPERUSER`,
  ]);
  if (alterRole.exitCode !== 0) {
    throw new Error(`Falha ao dar login pro papel arbora_app: ${alterRole.output}`);
  }

  // `APP_DATABASE_URL` (lido por PrismaService via ConfigService) passa a
  // apontar pro papel restrito — é como o próprio AppModule dos testes de
  // integração roda dali em diante, exercitando as políticas RLS de verdade,
  // não o superusuário `arbora` que só a migração usa.
  const appDatabaseUrl = new URL(databaseUrl);
  appDatabaseUrl.username = 'arbora_app';
  appDatabaseUrl.password = senhaAppRole;
  process.env.APP_DATABASE_URL = appDatabaseUrl.toString();

  globalThis.__ARBORA_PG_CONTAINER__ = container;
}
