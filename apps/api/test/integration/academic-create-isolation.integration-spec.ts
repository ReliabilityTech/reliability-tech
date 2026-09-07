import { type INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

import { buildTestApp } from './build-test-app';
import { criarTenantComFixtures, SENHA_FIXTURE } from './fixtures';

/**
 * Complementa tenant-isolation.integration-spec.ts (Fase 4.2): aquele cobre
 * leitura, este cobre ESCRITA — o cenário que POST /alunos com um turmaId de
 * outro tenant existe pra pegar (ver alunos.service.ts). Um teste unitário
 * com Prisma mockado não pegaria isso: o mock nunca teria um turmaId real de
 * outro tenant pra rejeitar.
 *
 * Fixtures usam uma conexão como `arbora` (superusuário, ignora RLS — ver
 * roadmap 6.2) em vez do `PrismaService` da aplicação: fora de uma
 * requisição não existe contexto de tenant no `AsyncLocalStorage`, e a
 * política RLS é fail-closed — o papel restrito `arbora_app` não teria como
 * inserir nada nesse setup.
 */
describe('Isolamento entre tenants — escrita (POST /api/v1/turmas, /api/v1/alunos)', () => {
  let app: INestApplication;
  const prismaAdmin = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

  beforeAll(async () => {
    app = await buildTestApp();

    await criarTenantComFixtures(prismaAdmin, {
      slug: 'tenant-a-academic',
      nomeTenant: 'Tenant A Academic',
      emailAdmin: 'admin-a@tenant-a-academic.local',
      nomesAlunos: [],
    });
    await criarTenantComFixtures(prismaAdmin, {
      slug: 'tenant-b-academic',
      nomeTenant: 'Tenant B Academic',
      emailAdmin: 'admin-b@tenant-b-academic.local',
      nomesAlunos: [],
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

  it('rejeita cadastrar aluno com turmaId de outro tenant', async () => {
    const agenteA = await loginComo('admin-a@tenant-a-academic.local');
    const respostaTurma = await agenteA
      .post('/api/v1/turmas')
      .send({ nome: '5º Ano A', serie: '5º Ano', anoLetivo: 2026 })
      .expect(201);
    const turmaIdDoTenantA = (respostaTurma.body as { id: string }).id;

    const agenteB = await loginComo('admin-b@tenant-b-academic.local');
    await agenteB
      .post('/api/v1/alunos')
      .send({
        nome: 'Aluno Indevido',
        dataNascimento: '2016-01-01T00:00:00.000Z',
        matricula: 'indevido-0001',
        turmaId: turmaIdDoTenantA,
      })
      .expect(400);
  });

  it('cadastra um aluno associado a uma turma do mesmo tenant', async () => {
    const agenteA = await loginComo('admin-a@tenant-a-academic.local');
    const respostaTurma = await agenteA
      .post('/api/v1/turmas')
      .send({ nome: '6º Ano A', serie: '6º Ano', anoLetivo: 2026 })
      .expect(201);
    const turmaId = (respostaTurma.body as { id: string }).id;

    await agenteA
      .post('/api/v1/alunos')
      .send({
        nome: 'Aluno Válido',
        dataNascimento: '2016-01-01T00:00:00.000Z',
        matricula: 'valido-0001',
        turmaId,
      })
      .expect(201);
  });
});

/**
 * Mesma lógica do describe acima, pra POST /api/v1/turma-disciplinas: um
 * teste unitário com Prisma mockado nunca teria um turmaId/disciplinaId/
 * professorId reais de outro tenant pra rejeitar — só um banco de verdade
 * com dois tenants sobrepostos pega essa omissão.
 */
describe('Isolamento entre tenants — escrita (POST /api/v1/turma-disciplinas)', () => {
  let app: INestApplication;
  const prismaAdmin = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

  beforeAll(async () => {
    app = await buildTestApp();

    await criarTenantComFixtures(prismaAdmin, {
      slug: 'tenant-a-td',
      nomeTenant: 'Tenant A TD',
      emailAdmin: 'admin-a@tenant-a-td.local',
      nomesAlunos: [],
    });
    await criarTenantComFixtures(prismaAdmin, {
      slug: 'tenant-b-td',
      nomeTenant: 'Tenant B TD',
      emailAdmin: 'admin-b@tenant-b-td.local',
      nomesAlunos: [],
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

  it('rejeita atribuir turma, disciplina e professor de outro tenant', async () => {
    const agenteA = await loginComo('admin-a@tenant-a-td.local');
    const [respostaTurma, respostaDisciplina, respostaProfessor] = await Promise.all([
      agenteA.post('/api/v1/turmas').send({ nome: '7º Ano A', serie: '7º Ano', anoLetivo: 2026 }),
      agenteA.post('/api/v1/disciplinas').send({ nome: 'Ciências' }),
      agenteA.post('/api/v1/usuarios').send({
        name: 'Professor A',
        email: 'professor-a@tenant-a-td.local',
        password: SENHA_FIXTURE,
      }),
    ]);
    const turmaIdDoTenantA = (respostaTurma.body as { id: string }).id;
    const disciplinaIdDoTenantA = (respostaDisciplina.body as { id: string }).id;
    const professorIdDoTenantA = (respostaProfessor.body as { id: string }).id;

    const agenteB = await loginComo('admin-b@tenant-b-td.local');
    const respostaTurmaB = await agenteB
      .post('/api/v1/turmas')
      .send({ nome: '7º Ano B', serie: '7º Ano', anoLetivo: 2026 })
      .expect(201);
    const respostaDisciplinaB = await agenteB
      .post('/api/v1/disciplinas')
      .send({ nome: 'Artes' })
      .expect(201);
    const respostaProfessorB = await agenteB
      .post('/api/v1/usuarios')
      .send({
        name: 'Professor B',
        email: 'professor-b@tenant-b-td.local',
        password: SENHA_FIXTURE,
      })
      .expect(201);

    await agenteB
      .post('/api/v1/turma-disciplinas')
      .send({
        turmaId: turmaIdDoTenantA,
        disciplinaId: (respostaDisciplinaB.body as { id: string }).id,
        professorId: (respostaProfessorB.body as { id: string }).id,
      })
      .expect(400);
    await agenteB
      .post('/api/v1/turma-disciplinas')
      .send({
        turmaId: (respostaTurmaB.body as { id: string }).id,
        disciplinaId: disciplinaIdDoTenantA,
        professorId: (respostaProfessorB.body as { id: string }).id,
      })
      .expect(400);
    await agenteB
      .post('/api/v1/turma-disciplinas')
      .send({
        turmaId: (respostaTurmaB.body as { id: string }).id,
        disciplinaId: (respostaDisciplinaB.body as { id: string }).id,
        professorId: professorIdDoTenantA,
      })
      .expect(400);
  });

  it('atribui turma+disciplina+professor do mesmo tenant, e reatribuir troca o professor', async () => {
    const agenteA = await loginComo('admin-a@tenant-a-td.local');
    const [respostaTurma, respostaDisciplina, respostaProfessor1, respostaProfessor2] =
      await Promise.all([
        agenteA.post('/api/v1/turmas').send({ nome: '8º Ano A', serie: '8º Ano', anoLetivo: 2026 }),
        agenteA.post('/api/v1/disciplinas').send({ nome: 'História' }),
        agenteA.post('/api/v1/usuarios').send({
          name: 'Professor Primeiro',
          email: 'professor-primeiro@tenant-a-td.local',
          password: SENHA_FIXTURE,
        }),
        agenteA.post('/api/v1/usuarios').send({
          name: 'Professor Segundo',
          email: 'professor-segundo@tenant-a-td.local',
          password: SENHA_FIXTURE,
        }),
      ]);
    const turmaId = (respostaTurma.body as { id: string }).id;
    const disciplinaId = (respostaDisciplina.body as { id: string }).id;
    const professor1Id = (respostaProfessor1.body as { id: string }).id;
    const professor2Id = (respostaProfessor2.body as { id: string }).id;

    const primeira = await agenteA
      .post('/api/v1/turma-disciplinas')
      .send({ turmaId, disciplinaId, professorId: professor1Id })
      .expect(201);

    const reatribuida = await agenteA
      .post('/api/v1/turma-disciplinas')
      .send({ turmaId, disciplinaId, professorId: professor2Id })
      .expect(201);

    expect((reatribuida.body as { id: string }).id).toBe((primeira.body as { id: string }).id);
  });
});
