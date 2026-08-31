import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  const criarServico = async (prismaOverrides?: Record<string, unknown>) => {
    const prisma = {
      tenant: { findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
      aluno: { count: jest.fn() },
      ...prismaOverrides,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [TenantsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    return { service: moduleRef.get(TenantsService), prisma };
  };

  describe('atualizarStatus', () => {
    it('atualiza o status do tenant informado', async () => {
      const { service, prisma } = await criarServico({
        tenant: { update: jest.fn().mockResolvedValue({ id: 'tenant-1' }) },
      });

      const resultado = await service.atualizarStatus('tenant-1', 'SUSPENSO');

      expect(resultado).toEqual({ id: 'tenant-1' });
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { status: 'SUSPENSO' },
      });
    });
  });

  describe('resumo', () => {
    it('agrega contagens de tenants ativos, suspensos e total de alunos', async () => {
      const { service, prisma } = await criarServico({
        tenant: {
          count: jest.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(1),
        },
        aluno: { count: jest.fn().mockResolvedValue(120) },
      });

      const resultado = await service.resumo();

      expect(resultado).toEqual({
        instituicoesAtivas: 4,
        instituicoesSuspensas: 1,
        totalAlunos: 120,
      });
      expect(prisma.tenant.count).toHaveBeenCalledWith({ where: { status: 'ATIVO' } });
      expect(prisma.tenant.count).toHaveBeenCalledWith({ where: { status: 'SUSPENSO' } });
    });
  });
});
