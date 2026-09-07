import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { criarTenantComFixtures } from './fixtures';

const API_ROOT = path.join(__dirname, '..', '..');

function getContainer(): StartedPostgreSqlContainer {
  const container = (globalThis as { __ARBORA_PG_CONTAINER__?: StartedPostgreSqlContainer })
    .__ARBORA_PG_CONTAINER__;
  if (!container) {
    throw new Error('Container Postgres do global-setup não está disponível.');
  }
  return container;
}

/** Prisma roda no processo do Jest, fora do container — precisa da porta mapeada no host. */
function uriExternaParaBanco(nomeBanco: string): string {
  const url = new URL(getContainer().getConnectionUri());
  url.pathname = `/${nomeBanco}`;
  return url.toString();
}

/**
 * pg_dump/pg_restore/psql rodam via `container.exec()`, ou seja, dentro do
 * próprio container — a porta mapeada no host (`getConnectionUri()`) não
 * significa nada nesse contexto; o Postgres escuta na 5432 interna.
 */
function uriInternaParaBanco(nomeBanco: string): string {
  const container = getContainer();
  return `postgresql://${container.getUsername()}:${container.getPassword()}@127.0.0.1:5432/${nomeBanco}`;
}

/**
 * Prova, contra um Postgres real (não mock), que o pg_dump/pg_restore usado
 * pelo backup automatizado (docs/backup.md, apps/api/scripts/) de fato
 * preserva os dados: dump de um banco com fixture conhecida, restore num
 * banco vazio, e comparação linha a linha entre os dois. O roadmap 5.5 pede
 * "restauração testada", não só um script que ninguém rodou de verdade.
 *
 * Usa dois bancos dentro do mesmo container/servidor (CREATE DATABASE) em
 * vez de subir um segundo Postgres — mais rápido e evita coordenar dois
 * containers só pra este teste.
 */
describe('Backup e restauração — pg_dump/pg_restore contra Postgres real', () => {
  const sufixo = randomUUID().replaceAll('-', '');
  const bancoOrigem = `backup_origem_${sufixo}`;
  const bancoDestino = `backup_destino_${sufixo}`;
  const caminhoDump = `/tmp/${bancoOrigem}.dump`;

  let tenantId: string;

  beforeAll(async () => {
    const container = getContainer();
    const usuario = container.getUsername();
    const senha = container.getPassword();

    for (const nomeBanco of [bancoOrigem, bancoDestino]) {
      const criado = await container.exec(
        ['psql', '-U', usuario, '-d', 'postgres', '-c', `CREATE DATABASE ${nomeBanco}`],
        { env: { PGPASSWORD: senha } },
      );
      if (criado.exitCode !== 0) {
        throw new Error(`Falha ao criar banco "${nomeBanco}": ${criado.output}`);
      }
    }

    // Mesmas migrações reais que já rodaram no banco padrão (global-setup.mjs)
    // — precisam rodar de novo aqui porque bancoOrigem é um banco novo, vazio.
    execSync('prisma migrate deploy', {
      cwd: API_ROOT,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: uriExternaParaBanco(bancoOrigem) },
    });

    const prisma = new PrismaClient({
      datasources: { db: { url: uriExternaParaBanco(bancoOrigem) } },
    });
    const fixture = await criarTenantComFixtures(prisma, {
      slug: 'ensaio-de-backup',
      nomeTenant: 'Escola do Ensaio de Backup',
      emailAdmin: 'admin@ensaio-de-backup.local',
      nomesAlunos: ['Aluno Fixture Um', 'Aluno Fixture Dois'],
    });
    tenantId = fixture.tenantId;
    await prisma.$disconnect();
  });

  afterAll(async () => {
    const container = getContainer();
    await container.exec(['rm', '-f', caminhoDump]);
    for (const nomeBanco of [bancoOrigem, bancoDestino]) {
      await container.exec([
        'psql',
        '-U',
        container.getUsername(),
        '-d',
        'postgres',
        '-c',
        `DROP DATABASE IF EXISTS ${nomeBanco}`,
      ]);
    }
  });

  it('restaura em outro banco os mesmos dados do original, com o mesmo pg_dump/pg_restore do backup de produção', async () => {
    const container = getContainer();

    const dump = await container.exec([
      'pg_dump',
      '--format=custom',
      '--no-owner',
      `--file=${caminhoDump}`,
      '--dbname',
      uriInternaParaBanco(bancoOrigem),
    ]);
    expect(dump.exitCode).toBe(0);

    const restore = await container.exec([
      'pg_restore',
      '--no-owner',
      '--dbname',
      uriInternaParaBanco(bancoDestino),
      caminhoDump,
    ]);
    expect(restore.exitCode).toBe(0);

    const prismaOrigem = new PrismaClient({
      datasources: { db: { url: uriExternaParaBanco(bancoOrigem) } },
    });
    const prismaDestino = new PrismaClient({
      datasources: { db: { url: uriExternaParaBanco(bancoDestino) } },
    });

    try {
      const [tenantOrigem, tenantDestino] = await Promise.all([
        prismaOrigem.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
        prismaDestino.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
      ]);
      expect(tenantDestino).toEqual(tenantOrigem);

      const [alunosOrigem, alunosDestino] = await Promise.all([
        prismaOrigem.aluno.findMany({ where: { tenantId }, orderBy: { nome: 'asc' } }),
        prismaDestino.aluno.findMany({ where: { tenantId }, orderBy: { nome: 'asc' } }),
      ]);
      expect(alunosDestino).toEqual(alunosOrigem);
      expect(alunosDestino.map((aluno) => aluno.nome)).toEqual([
        'Aluno Fixture Dois',
        'Aluno Fixture Um',
      ]);

      const [contagemOrigem, contagemDestino] = await Promise.all([
        prismaOrigem.user.count(),
        prismaDestino.user.count(),
      ]);
      expect(contagemDestino).toBe(contagemOrigem);
    } finally {
      await prismaOrigem.$disconnect();
      await prismaDestino.$disconnect();
    }
  });
});
