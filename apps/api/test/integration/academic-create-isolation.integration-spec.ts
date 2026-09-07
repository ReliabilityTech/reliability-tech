import { type INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../../src/prisma/prisma.service';
import { buildTestApp } from './build-test-app';
import { criarTenantComFixtures, SENHA_FIXTURE } from './fixtures';

/**
 * Complementa tenant-isolation.integration-spec.ts (Fase 4.2): aquele cobre
 * leitura, este cobre ESCRITA — o cenário que POST /alunos com um turmaId de
 * outro tenant existe pra pegar (ver alunos.service.ts). Um teste unitário
 * com Prisma mockado não pegaria isso: o mock nunca teria um turmaId real de
 * outro tenant pra rejeitar.
 */
describe('Isolamento entre tenants — escrita (POST /api/v1/turmas, /api/v1/alunos)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await buildTestApp();
    prisma = app.get(PrismaService);

    await criarTenantComFixtures(prisma, {
      slug: 'tenant-a-academic',
      nomeTenant: 'Tenant A Academic',
      emailAdmin: 'admin-a@tenant-a-academic.local',
      nomesAlunos: [],
    });
    await criarTenantComFixtures(prisma, {
      slug: 'tenant-b-academic',
      nomeTenant: 'Tenant B Academic',
      emailAdmin: 'admin-b@tenant-b-academic.local',
      nomesAlunos: [],
    });
  });

  afterAll(async () => {
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
