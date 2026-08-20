import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const criarServico = async (ping: jest.Mock): Promise<HealthService> => {
    const moduleRef = await Test.createTestingModule({
      providers: [HealthService, { provide: PrismaService, useValue: { ping } }],
    }).compile();

    return moduleRef.get(HealthService);
  };

  it('reporta ok quando o banco responde', async () => {
    const service = await criarServico(jest.fn().mockResolvedValue(7));
    const resultado = await service.check();

    expect(resultado.status).toBe('ok');
    expect(resultado.checks.database).toEqual({ status: 'ok', latencyMs: 7 });
  });

  it('reporta down e expõe a causa quando o banco falha', async () => {
    const service = await criarServico(jest.fn().mockRejectedValue(new Error('conexão recusada')));
    const resultado = await service.check();

    expect(resultado.status).toBe('down');
    expect(resultado.checks.database?.status).toBe('down');
    expect(resultado.checks.database?.message).toBe('conexão recusada');
  });

  it('inclui uptime não negativo na resposta', async () => {
    const service = await criarServico(jest.fn().mockResolvedValue(1));
    expect((await service.check()).uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
