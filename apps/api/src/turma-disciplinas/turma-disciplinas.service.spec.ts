import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { TurmaDisciplinasService } from './turma-disciplinas.service';

describe('TurmaDisciplinasService', () => {
  const criarServico = async (prismaOverrides?: Record<string, unknown>) => {
    const prisma = {
      turma: { findFirst: jest.fn().mockResolvedValue({ id: 'turma-1' }) },
      disciplina: { findFirst: jest.fn().mockResolvedValue({ id: 'disciplina-1' }) },
      user: { findFirst: jest.fn().mockResolvedValue({ id: 'prof-1', role: 'PROFESSOR' }) },
      turmaDisciplina: { upsert: jest.fn() },
      ...prismaOverrides,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [TurmaDisciplinasService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    return { service: moduleRef.get(TurmaDisciplinasService), prisma };
  };

  const dados = { turmaId: 'turma-1', disciplinaId: 'disciplina-1', professorId: 'prof-1' };

  describe('atribuir', () => {
    it('cria a atribuição via upsert quando ainda não existe', async () => {
      const { service, prisma } = await criarServico({
        turmaDisciplina: { upsert: jest.fn().mockResolvedValue({ id: 'td-1' }) },
      });

      const resultado = await service.atribuir('tenant-1', dados);

      expect(resultado).toEqual({ id: 'td-1' });
      expect(prisma.turmaDisciplina.upsert).toHaveBeenCalledWith({
        where: { turmaId_disciplinaId: { turmaId: 'turma-1', disciplinaId: 'disciplina-1' } },
        update: { professorId: 'prof-1' },
        create: { turmaId: 'turma-1', disciplinaId: 'disciplina-1', professorId: 'prof-1' },
      });
    });

    it('troca o professor quando a turma+disciplina já tinha outro atribuído (upsert reatribui)', async () => {
      const { service, prisma } = await criarServico({
        user: { findFirst: jest.fn().mockResolvedValue({ id: 'prof-2', role: 'PROFESSOR' }) },
        turmaDisciplina: { upsert: jest.fn().mockResolvedValue({ id: 'td-1' }) },
      });

      await service.atribuir('tenant-1', { ...dados, professorId: 'prof-2' });

      expect(prisma.turmaDisciplina.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { professorId: 'prof-2' } }),
      );
    });

    it('rejeita turma de outro tenant', async () => {
      const { service, prisma } = await criarServico({
        turma: { findFirst: jest.fn().mockResolvedValue(null) },
      });

      await expect(service.atribuir('tenant-1', dados)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.turmaDisciplina.upsert).not.toHaveBeenCalled();
    });

    it('rejeita disciplina de outro tenant', async () => {
      const { service, prisma } = await criarServico({
        disciplina: { findFirst: jest.fn().mockResolvedValue(null) },
      });

      await expect(service.atribuir('tenant-1', dados)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.turmaDisciplina.upsert).not.toHaveBeenCalled();
    });

    it('rejeita professor de outro tenant (ou que não é PROFESSOR)', async () => {
      const { service, prisma } = await criarServico({
        user: { findFirst: jest.fn().mockResolvedValue(null) },
      });

      await expect(service.atribuir('tenant-1', dados)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.turmaDisciplina.upsert).not.toHaveBeenCalled();
    });
  });
});
