import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ResponsavelService } from './responsavel.service';

describe('ResponsavelService', () => {
  const criarServico = async (prismaOverrides?: Record<string, unknown>) => {
    const prisma = {
      alunoResponsavel: { findMany: jest.fn(), findFirst: jest.fn() },
      movimentacao: { findMany: jest.fn() },
      ...prismaOverrides,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ResponsavelService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    return { service: moduleRef.get(ResponsavelService), prisma };
  };

  describe('listarMovimentacoes', () => {
    it('lança ForbiddenException quando o aluno não está vinculado ao responsável', async () => {
      const { service, prisma } = await criarServico({
        alunoResponsavel: { findFirst: jest.fn().mockResolvedValue(null) },
      });

      await expect(
        service.listarMovimentacoes('tenant-1', 'responsavel-1', 'aluno-de-outra-familia'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.movimentacao.findMany).not.toHaveBeenCalled();
    });

    it('retorna as movimentações do aluno quando o vínculo existe', async () => {
      const { service } = await criarServico({
        alunoResponsavel: { findFirst: jest.fn().mockResolvedValue({ id: 'vinculo-1' }) },
        movimentacao: {
          findMany: jest
            .fn()
            .mockResolvedValue([
              { id: 'mov-1', tipo: 'ENTRADA', dataHora: new Date('2026-03-10T08:00:00.000Z') },
            ]),
        },
      });

      const resultado = await service.listarMovimentacoes('tenant-1', 'responsavel-1', 'aluno-1');

      expect(resultado).toEqual([
        { id: 'mov-1', tipo: 'ENTRADA', quando: '2026-03-10T08:00:00.000Z' },
      ]);
    });
  });
});
