import { type INestApplication } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';

import { buildTestApp } from './build-test-app';
import { criarTenantComFixtures, SENHA_FIXTURE } from './fixtures';

/**
 * Prova que é o Postgres bloqueando, não só o código da aplicação (roadmap
 * 6.2, ADR 0006) — a diferença entre "a política existe" e "a política
 * funciona". Usa uma conexão raw como `arbora_app` (o mesmo papel que a API
 * usa em runtime, ver PrismaService) pra ler/escrever uma linha de outro
 * tenant *sem* filtro de tenantId na query, o tipo de acesso que um bug de
 * aplicação faria — e confirma que `arbora` (superusuário, o que roda
 * migração) não é bloqueado, documentando por que só a API pode rodar como
 * `arbora_app`.
 */
describe('RLS — isolamento entre tenants direto no Postgres', () => {
  let app: INestApplication;
  let tenantAId: string;
  let tenantBId: string;
  let turmaIdTenantA: string;

  // `superuserClient` (papel `arbora`) é quem monta as fixtures — fora de uma
  // requisição não há contexto de tenant no AsyncLocalStorage, e a política
  // RLS é fail-closed, então inserir como o papel restrito `arbora_app`
  // (`appRoleClient`) sem esse contexto seria rejeitado pelo `WITH CHECK`.
  // `appRoleClient` é quem prova o bloqueio: é o mesmo papel que a API usa
  // em runtime (ver PrismaService).
  const superuserClient = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  const appRoleClient = new PrismaClient({
    datasources: { db: { url: process.env.APP_DATABASE_URL } },
  });

  beforeAll(async () => {
    app = await buildTestApp();

    const tenantA = await criarTenantComFixtures(superuserClient, {
      slug: 'tenant-a-rls',
      nomeTenant: 'Tenant A RLS',
      emailAdmin: 'admin-a@tenant-a-rls.local',
      nomesAlunos: ['Aluno A1'],
    });
    tenantAId = tenantA.tenantId;
    const tenantB = await criarTenantComFixtures(superuserClient, {
      slug: 'tenant-b-rls',
      nomeTenant: 'Tenant B RLS',
      emailAdmin: 'admin-b@tenant-b-rls.local',
      nomesAlunos: ['Aluno B1', 'Aluno B2'],
    });
    tenantBId = tenantB.tenantId;

    const agenteA = request.agent(app.getHttpServer());
    await agenteA
      .post('/api/v1/auth/login')
      .send({ email: tenantA.adminEmail, password: SENHA_FIXTURE, rememberMe: false })
      .expect(200);
    const respostaTurma = await agenteA
      .post('/api/v1/turmas')
      .send({ nome: 'Turma RLS A', serie: '5º Ano', anoLetivo: 2026 })
      .expect(201);
    turmaIdTenantA = (respostaTurma.body as { id: string }).id;
  });

  afterAll(async () => {
    await appRoleClient.$disconnect();
    await superuserClient.$disconnect();
    await app.close();
  });

  it('esconde a linha de outro tenant num SELECT sem filtro de tenantId', async () => {
    const [, comContextoErrado] = await appRoleClient.$transaction([
      appRoleClient.$executeRaw`SELECT set_config('app.tenant_id', ${tenantBId}, true)`,
      appRoleClient.$queryRaw`SELECT id FROM turmas WHERE id = ${turmaIdTenantA}`,
    ]);
    expect(comContextoErrado).toHaveLength(0);

    const [, comContextoCerto] = await appRoleClient.$transaction([
      appRoleClient.$executeRaw`SELECT set_config('app.tenant_id', ${tenantAId}, true)`,
      appRoleClient.$queryRaw`SELECT id FROM turmas WHERE id = ${turmaIdTenantA}`,
    ]);
    expect(comContextoCerto).toHaveLength(1);
  });

  it('não deixa um UPDATE afetar a linha de outro tenant, mesmo achando o id certo', async () => {
    const [, linhasAfetadas] = await appRoleClient.$transaction([
      appRoleClient.$executeRaw`SELECT set_config('app.tenant_id', ${tenantBId}, true)`,
      appRoleClient.$executeRaw`UPDATE turmas SET nome = 'Nome invadido' WHERE id = ${turmaIdTenantA}`,
    ]);
    expect(linhasAfetadas).toBe(0);
  });

  it('sem nenhum app.tenant_id setado (fail-closed), a linha some pra qualquer tenant', async () => {
    const linhas =
      await appRoleClient.$queryRaw`SELECT id FROM turmas WHERE id = ${turmaIdTenantA}`;
    expect(linhas).toHaveLength(0);
  });

  it('NÃO bloqueia como arbora (superusuário) — por isso só a API roda como arbora_app', async () => {
    const linhas =
      await superuserClient.$queryRaw`SELECT id FROM turmas WHERE id = ${turmaIdTenantA}`;
    expect(linhas).toHaveLength(1);
  });

  it('super-admin (bypass) vê o total real de alunos de cada tenant, não zero', async () => {
    const passwordHash = await argon2.hash(SENHA_FIXTURE, { type: argon2.argon2id });
    await superuserClient.user.create({
      data: {
        name: 'Super Admin RLS',
        email: 'super-admin-rls@arbora.local',
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        tenantId: null,
      },
    });

    const agenteSuperAdmin = request.agent(app.getHttpServer());
    await agenteSuperAdmin
      .post('/api/v1/auth/login')
      .send({ email: 'super-admin-rls@arbora.local', password: SENHA_FIXTURE, rememberMe: false })
      .expect(200);

    const resposta = await agenteSuperAdmin.get('/api/v1/tenants').expect(200);
    const tenants = resposta.body as Array<{ id: string; totalAlunos: number }>;

    expect(tenants.find((t) => t.id === tenantAId)?.totalAlunos).toBe(1);
    expect(tenants.find((t) => t.id === tenantBId)?.totalAlunos).toBe(2);
  });
});
