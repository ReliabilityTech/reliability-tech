import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { TurmasService } from './turmas.service';

describe('TurmasService', () => {
  const criarServico = async (prismaOverrides?: Record<string, unknown>) => {
    const prisma = {
      turma: { findMany: jest.fn(), create: jest.fn() },
      ...prismaOverrides,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [TurmasService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    return { service: moduleRef.get(TurmasService), prisma };
  };

  describe('listar', () => {
    it('lista as turmas do tenant', async () => {
      const { service, prisma } = await criarServico({
        turma: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ id: 't1', nome: '5º Ano A', serie: '5º Ano', anoLetivo: 2026 }]),
        },
      });

      const resultado = await service.listar('tenant-1');

      expect(resultado).toEqual([{ id: 't1', nome: '5º Ano A', serie: '5º Ano', anoLetivo: 2026 }]);
      expect(prisma.turma.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', deletedAt: null },
        orderBy: { nome: 'asc' },
      });
    });
  });

  describe('criar', () => {
    const dados = { nome: '6º Ano A', serie: '6º Ano', anoLetivo: 2026 };

    it('cria a turma vinculada ao tenant e devolve o id', async () => {
      const { service, prisma } = await criarServico({
        turma: { create: jest.fn().mockResolvedValue({ id: 'turma-nova' }) },
      });

      const resultado = await service.criar('tenant-1', dados);

      expect(resultado).toEqual({ id: 'turma-nova' });
      expect(prisma.turma.create).toHaveBeenCalledWith({
        data: { tenantId: 'tenant-1', ...dados },
      });
    });

    it('rejeita nome duplicado no mesmo ano letivo com ConflictException', async () => {
      const erroPrisma = new Prisma.PrismaClientKnownRequestError('nome já existe', {
        code: 'P2002',
        clientVersion: '6.14.0',
      });
      const { service } = await criarServico({
        turma: { create: jest.fn().mockRejectedValue(erroPrisma) },
      });

      await expect(service.criar('tenant-1', dados)).rejects.toThrow(
        'Já existe uma turma com esse nome neste ano letivo',
      );
    });
  });
});
