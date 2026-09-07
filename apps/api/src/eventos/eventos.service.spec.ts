import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { EventosService } from './eventos.service';

describe('EventosService', () => {
  const criarServico = async (prismaOverrides?: Record<string, unknown>) => {
    const db = {
      evento: { findMany: jest.fn(), create: jest.fn() },
      ...prismaOverrides,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [EventosService, { provide: PrismaService, useValue: { db } }],
    }).compile();

    return { service: moduleRef.get(EventosService), prisma: db };
  };

  describe('listar', () => {
    it('usa "Toda a instituição" implícito (null) quando o evento não tem turma', async () => {
      const { service } = await criarServico({
        evento: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'ev-1',
              titulo: 'Feira de Ciências',
              tipo: 'EVENTO',
              dataInicio: new Date('2026-04-01T00:00:00.000Z'),
              dataFim: null,
              turma: null,
            },
            {
              id: 'ev-2',
              titulo: 'Prova de Matemática',
              tipo: 'PROVA',
              dataInicio: new Date('2026-04-02T00:00:00.000Z'),
              dataFim: null,
              turma: { nome: '5º Ano A' },
            },
          ]),
        },
      });

      const resultado = await service.listar('tenant-1');

      expect(resultado[0]?.turmaNome).toBeNull();
      expect(resultado[1]?.turmaNome).toBe('5º Ano A');
    });
  });

  describe('criar', () => {
    it('usa null como padrão para descricao, dataFim e turmaId quando omitidos', async () => {
      const { service, prisma } = await criarServico({
        evento: { create: jest.fn().mockResolvedValue({ id: 'ev-novo' }) },
      });

      const resultado = await service.criar('tenant-1', {
        titulo: 'Conselho de Classe',
        tipo: 'REUNIAO',
        dataInicio: '2026-05-01T00:00:00.000Z',
      });

      expect(resultado).toEqual({ id: 'ev-novo' });
      expect(prisma.evento.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          titulo: 'Conselho de Classe',
          descricao: null,
          tipo: 'REUNIAO',
          dataInicio: new Date('2026-05-01T00:00:00.000Z'),
          dataFim: null,
          turmaId: null,
        },
      });
    });
  });
});
