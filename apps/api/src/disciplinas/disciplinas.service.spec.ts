import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { DisciplinasService } from './disciplinas.service';

describe('DisciplinasService', () => {
  const criarServico = async (prismaOverrides?: Record<string, unknown>) => {
    const prisma = {
      disciplina: { findMany: jest.fn(), create: jest.fn() },
      ...prismaOverrides,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [DisciplinasService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    return { service: moduleRef.get(DisciplinasService), prisma };
  };

  describe('listar', () => {
    it('lista as disciplinas do tenant', async () => {
      const { service, prisma } = await criarServico({
        disciplina: { findMany: jest.fn().mockResolvedValue([{ id: 'd1', nome: 'Matemática' }]) },
      });

      const resultado = await service.listar('tenant-1');

      expect(resultado).toEqual([{ id: 'd1', nome: 'Matemática' }]);
      expect(prisma.disciplina.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', deletedAt: null },
        orderBy: { nome: 'asc' },
      });
    });
  });

  describe('criar', () => {
    it('cria a disciplina vinculada ao tenant e devolve o id', async () => {
      const { service, prisma } = await criarServico({
        disciplina: { create: jest.fn().mockResolvedValue({ id: 'disciplina-nova' }) },
      });

      const resultado = await service.criar('tenant-1', { nome: 'História' });

      expect(resultado).toEqual({ id: 'disciplina-nova' });
      expect(prisma.disciplina.create).toHaveBeenCalledWith({
        data: { tenantId: 'tenant-1', nome: 'História' },
      });
    });

    it('rejeita nome duplicado com ConflictException', async () => {
      const erroPrisma = new Prisma.PrismaClientKnownRequestError('nome já existe', {
        code: 'P2002',
        clientVersion: '6.14.0',
      });
      const { service } = await criarServico({
        disciplina: { create: jest.fn().mockRejectedValue(erroPrisma) },
      });

      await expect(service.criar('tenant-1', { nome: 'História' })).rejects.toThrow(
        'Já existe uma disciplina com esse nome',
      );
    });
  });
});
