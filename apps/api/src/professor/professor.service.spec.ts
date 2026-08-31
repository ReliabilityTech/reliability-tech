import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ProfessorService } from './professor.service';

describe('ProfessorService', () => {
  const criarServico = async (prismaOverrides?: Record<string, unknown>) => {
    const prisma = {
      turmaDisciplina: { findMany: jest.fn(), findFirst: jest.fn() },
      periodoLetivo: { findMany: jest.fn() },
      aluno: { findMany: jest.fn() },
      nota: { findMany: jest.fn(), upsert: jest.fn() },
      presenca: { findMany: jest.fn(), upsert: jest.fn() },
      $transaction: jest.fn((operacoes: unknown[]) => Promise.all(operacoes)),
      ...prismaOverrides,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ProfessorService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    return { service: moduleRef.get(ProfessorService), prisma };
  };

  describe('listarNotas', () => {
    it('deriva a situação a partir do valor e do mínimo de aprovação (6)', async () => {
      const { service } = await criarServico({
        turmaDisciplina: {
          findFirst: jest.fn().mockResolvedValue({ id: 'td-1', turmaId: 'turma-1' }),
        },
        aluno: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'aluno-1', nome: 'Ana' },
            { id: 'aluno-2', nome: 'Bruno' },
            { id: 'aluno-3', nome: 'Carla' },
          ]),
        },
        nota: {
          findMany: jest.fn().mockResolvedValue([
            { alunoId: 'aluno-1', valor: 8.5 },
            { alunoId: 'aluno-2', valor: 4.0 },
          ]),
        },
      });

      const resultado = await service.listarNotas('tenant-1', 'prof-1', 'td-1', 'periodo-1');

      expect(resultado).toEqual([
        { alunoId: 'aluno-1', alunoNome: 'Ana', valor: 8.5, situacao: 'APROVADO' },
        { alunoId: 'aluno-2', alunoNome: 'Bruno', valor: 4, situacao: 'ATENCAO' },
        { alunoId: 'aluno-3', alunoNome: 'Carla', valor: null, situacao: 'SEM_NOTA' },
      ]);
    });

    it('lança NotFoundException quando a turma/disciplina não pertence ao professor', async () => {
      const { service } = await criarServico({
        turmaDisciplina: { findFirst: jest.fn().mockResolvedValue(null) },
      });

      await expect(
        service.listarNotas('tenant-1', 'prof-1', 'td-de-outro-professor', 'periodo-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('lancarNota', () => {
    it('confirma a posse da turma antes de fazer o upsert', async () => {
      const { service, prisma } = await criarServico({
        turmaDisciplina: { findFirst: jest.fn().mockResolvedValue({ id: 'td-1' }) },
        nota: { upsert: jest.fn().mockResolvedValue({ id: 'nota-1' }) },
      });

      const resultado = await service.lancarNota('tenant-1', 'prof-1', {
        alunoId: 'aluno-1',
        turmaDisciplinaId: 'td-1',
        periodoLetivoId: 'periodo-1',
        valor: 7,
      });

      expect(resultado).toEqual({ id: 'nota-1' });
      expect(prisma.turmaDisciplina.findFirst).toHaveBeenCalledWith({
        where: { id: 'td-1', professorId: 'prof-1', turma: { tenantId: 'tenant-1' } },
      });
    });
  });

  describe('registrarPresencas', () => {
    it('faz upsert em lote dentro de uma transação', async () => {
      const { service, prisma } = await criarServico({
        turmaDisciplina: { findFirst: jest.fn().mockResolvedValue({ id: 'td-1' }) },
      });

      const resultado = await service.registrarPresencas('tenant-1', 'prof-1', {
        turmaDisciplinaId: 'td-1',
        data: '2026-03-10',
        registros: [
          { alunoId: 'aluno-1', presente: true },
          { alunoId: 'aluno-2', presente: false },
        ],
      });

      expect(resultado).toEqual({ registrados: 2 });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.presenca.upsert).toHaveBeenCalledTimes(2);
    });
  });
});
