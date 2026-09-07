import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { RecadosService } from './recados.service';

describe('RecadosService', () => {
  const criarServico = async (prismaOverrides?: Record<string, unknown>) => {
    const prisma = {
      recado: { findMany: jest.fn(), create: jest.fn() },
      alunoResponsavel: { count: jest.fn() },
      user: { count: jest.fn() },
      ...prismaOverrides,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [RecadosService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    return { service: moduleRef.get(RecadosService), prisma };
  };

  describe('listar', () => {
    it('calcula leituraPercentual com base nos destinatários certos por tipo', async () => {
      const { service, prisma } = await criarServico({
        recado: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'r-1',
              titulo: 'Toda a instituição',
              destinatario: 'TODA_INSTITUICAO',
              turma: null,
              aluno: null,
              autor: { name: 'Diretora' },
              publicadoEm: new Date('2026-03-01T00:00:00.000Z'),
              _count: { confirmacoesLeitura: 5 },
            },
            {
              id: 'r-2',
              titulo: 'Sem destinatários',
              destinatario: 'INDIVIDUAL',
              alunoId: 'aluno-1',
              turma: null,
              aluno: { nome: 'Pedro' },
              autor: { name: 'Professor' },
              publicadoEm: new Date('2026-03-02T00:00:00.000Z'),
              _count: { confirmacoesLeitura: 0 },
            },
          ]),
        },
        user: { count: jest.fn().mockResolvedValue(10) },
        alunoResponsavel: { count: jest.fn().mockResolvedValue(0) },
      });

      const resultado = await service.listar('tenant-1');

      expect(resultado[0]).toMatchObject({
        leituraPercentual: 50,
        destinatarioLabel: 'Toda a instituição',
      });
      expect(resultado[1]).toMatchObject({
        leituraPercentual: null,
        destinatarioLabel: 'Aluno: Pedro',
      });
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', role: 'RESPONSAVEL', deletedAt: null },
      });
    });
  });

  describe('criar', () => {
    it('exige turmaId quando destinatario é TURMA', async () => {
      const { service } = await criarServico();

      await expect(
        service.criar('tenant-1', 'autor-1', {
          titulo: 'Aviso',
          corpo: 'Corpo',
          destinatario: 'TURMA',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('exige alunoId quando destinatario é INDIVIDUAL', async () => {
      const { service } = await criarServico();

      await expect(
        service.criar('tenant-1', 'autor-1', {
          titulo: 'Aviso',
          corpo: 'Corpo',
          destinatario: 'INDIVIDUAL',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cria normalmente quando destinatario é TODA_INSTITUICAO', async () => {
      const { service, prisma } = await criarServico({
        recado: { create: jest.fn().mockResolvedValue({ id: 'r-novo' }) },
      });

      const resultado = await service.criar('tenant-1', 'autor-1', {
        titulo: 'Aviso geral',
        corpo: 'Corpo',
        destinatario: 'TODA_INSTITUICAO',
      });

      expect(resultado).toEqual({ id: 'r-novo' });
      expect(prisma.recado.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          autorId: 'autor-1',
          titulo: 'Aviso geral',
          corpo: 'Corpo',
          destinatario: 'TODA_INSTITUICAO',
          turmaId: null,
          alunoId: null,
        },
      });
    });
  });
});
