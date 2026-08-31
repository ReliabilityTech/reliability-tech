import { Test } from '@nestjs/testing';

import { AlunosService } from '../alunos/alunos.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfessorService } from '../professor/professor.service';
import { TenantsService } from '../tenants/tenants.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const criarServico = async (options?: {
    prismaOverrides?: Record<string, unknown>;
    frequenciaPorAluno?: Map<string, number>;
  }) => {
    const prisma = {
      aluno: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'aluno-1', nome: 'Ana', turma: { nome: '5º Ano A' } },
          { id: 'aluno-2', nome: 'Bruno', turma: { nome: '5º Ano A' } },
          { id: 'aluno-3', nome: 'Carla', turma: null },
        ]),
      },
      presenca: { count: jest.fn().mockResolvedValue(2) },
      recado: { count: jest.fn().mockResolvedValue(3) },
      auditLog: {
        findMany: jest.fn().mockResolvedValue([
          { action: 'LOGIN', createdAt: new Date('2026-03-10T10:00:00.000Z') },
          { action: 'NOTA_LANCADA', createdAt: new Date('2026-03-10T09:00:00.000Z') },
          { action: 'ACAO_DESCONHECIDA', createdAt: new Date('2026-03-10T08:00:00.000Z') },
        ]),
      },
      ...options?.prismaOverrides,
    };

    const alunosService = {
      calcularFrequencia: jest.fn().mockResolvedValue(
        options?.frequenciaPorAluno ??
          new Map([
            ['aluno-1', 60],
            ['aluno-2', 90],
          ]),
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
        { provide: AlunosService, useValue: alunosService },
        { provide: ProfessorService, useValue: { listarTurmas: jest.fn() } },
        { provide: TenantsService, useValue: { resumo: jest.fn() } },
      ],
    }).compile();

    return { service: moduleRef.get(DashboardService), prisma, alunosService };
  };

  it('filtra apenas alunos abaixo de 80% de frequência, ordenados do pior para o melhor', async () => {
    const { service } = await criarServico();

    const resultado = await service.admin('tenant-1');

    expect(resultado.atencaoNecessaria).toEqual([
      { alunoId: 'aluno-1', nome: 'Ana', turmaNome: '5º Ano A', frequencia: 60 },
    ]);
  });

  it('calcula a frequência média arredondada só com quem tem registro', async () => {
    const { service } = await criarServico();

    const resultado = await service.admin('tenant-1');

    // (60 + 90) / 2 = 75 — aluno-3 não tem frequência registrada e é ignorado.
    expect(resultado.frequenciaMedia).toBe(75);
  });

  it('traduz as ações do audit log e ignora ações sem label conhecido usando o código bruto', async () => {
    const { service } = await criarServico();

    const resultado = await service.admin('tenant-1');

    expect(resultado.atividadesRecentes.map((a) => a.descricao)).toEqual([
      'Login realizado',
      'Nota lançada',
      'ACAO_DESCONHECIDA',
    ]);
  });

  it('retorna frequenciaMedia null quando nenhum aluno tem frequência calculada', async () => {
    const { service } = await criarServico({ frequenciaPorAluno: new Map() });

    const resultado = await service.admin('tenant-1');

    expect(resultado.frequenciaMedia).toBeNull();
    expect(resultado.atencaoNecessaria).toEqual([]);
  });
});
