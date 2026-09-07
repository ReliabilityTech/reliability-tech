import { type INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

import { buildTestApp } from './build-test-app';
import { criarTenantComFixtures, SENHA_FIXTURE } from './fixtures';

/**
 * ADR 0006/roadmap 6.2: a disciplina de `where: { tenantId }` no código é a
 * primeira barreira, RLS no Postgres é a segunda. Um teste unitário com
 * Prisma mockado não pega uma query que esqueceu esse filtro, porque o mock
 * devolve o que a gente mandar devolver. Só um teste contra um banco de
 * verdade, com dado de dois tenants de fato sobreposto, pega esse tipo de
 * vazamento (e prova RLS de fato bloqueando — ver row-level-security.integration-spec.ts).
 *
 * As fixtures usam uma conexão como `arbora` (superusuário, ignora RLS) em
 * vez do `PrismaService` da aplicação: criar dado de setup fora de uma
 * requisição não tem contexto de tenant nenhum no `AsyncLocalStorage`, e as
 * políticas RLS são fail-closed — inserir como o papel restrito `arbora_app`
 * sem esse contexto seria rejeitado pelo `WITH CHECK`.
 */
describe('Isolamento entre tenants — GET /api/v1/alunos', () => {
  let app: INestApplication;
  const prismaAdmin = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

  beforeAll(async () => {
    app = await buildTestApp();

    await criarTenantComFixtures(prismaAdmin, {
      slug: 'tenant-a-integration',
      nomeTenant: 'Tenant A Integration',
      emailAdmin: 'admin-a@tenant-a-integration.local',
      nomesAlunos: ['Fixture Aluno A1', 'Fixture Aluno A2'],
    });
    await criarTenantComFixtures(prismaAdmin, {
      slug: 'tenant-b-integration',
      nomeTenant: 'Tenant B Integration',
      emailAdmin: 'admin-b@tenant-b-integration.local',
      nomesAlunos: ['Fixture Aluno B1'],
    });
  });

  afterAll(async () => {
    await prismaAdmin.$disconnect();
    await app.close();
  });

  async function loginComo(email: string): Promise<ReturnType<typeof request.agent>> {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/v1/auth/login')
      .send({ email, password: SENHA_FIXTURE, rememberMe: false })
      .expect(200);
    return agent;
  }

  it('só devolve os alunos do próprio tenant, nunca os de outro', async () => {
    const agenteA = await loginComo('admin-a@tenant-a-integration.local');
    const respostaA = await agenteA.get('/api/v1/alunos').expect(200);
    const nomesA = (respostaA.body as Array<{ nome: string }>).map((aluno) => aluno.nome);

    expect(nomesA).toEqual(expect.arrayContaining(['Fixture Aluno A1', 'Fixture Aluno A2']));
    expect(nomesA).not.toContain('Fixture Aluno B1');

    const agenteB = await loginComo('admin-b@tenant-b-integration.local');
    const respostaB = await agenteB.get('/api/v1/alunos').expect(200);
    const nomesB = (respostaB.body as Array<{ nome: string }>).map((aluno) => aluno.nome);

    expect(nomesB).toEqual(['Fixture Aluno B1']);
    expect(nomesB).not.toContain('Fixture Aluno A1');
    expect(nomesB).not.toContain('Fixture Aluno A2');
  });

  it('sem sessão, a rota nem responde os dados — 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/alunos').expect(401);
  });
});
