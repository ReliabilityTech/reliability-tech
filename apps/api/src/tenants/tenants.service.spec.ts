import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  const criarServico = async (prismaOverrides?: Record<string, unknown>) => {
    const prisma = {
      tenant: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      aluno: { count: jest.fn() },
      ...prismaOverrides,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [TenantsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    return { service: moduleRef.get(TenantsService), prisma };
  };

  describe('criar', () => {
    const dados = { nome: 'Escola Nova', slug: 'escola-nova', plano: 'piloto' };

    it('cria o tenant e devolve o id', async () => {
      const { service, prisma } = await criarServico({
        tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-novo' }) },
      });

      const resultado = await service.criar(dados);

      expect(resultado).toEqual({ id: 'tenant-novo' });
      expect(prisma.tenant.create).toHaveBeenCalledWith({ data: dados });
    });

    it('rejeita slug duplicado com ConflictException', async () => {
      const erroPrisma = new Prisma.PrismaClientKnownRequestError('slug já existe', {
        code: 'P2002',
        clientVersion: '6.14.0',
      });
      const { service } = await criarServico({
        tenant: { create: jest.fn().mockRejectedValue(erroPrisma) },
      });

      await expect(service.criar(dados)).rejects.toThrow(
        'Já existe uma instituição com esse identificador (slug)',
      );
    });
  });

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
