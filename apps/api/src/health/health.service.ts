import { type HealthResponse, type HealthStatus } from '@arbora/contracts';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponse> {
    const database = await this.checkDatabase();
    const checks: HealthResponse['checks'] = { database };

    return {
      status: this.aggregate(checks),
      version: process.env.npm_package_version ?? '0.0.0',
      uptimeSeconds: Math.round(process.uptime()),
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthResponse['checks'][string]> {
    try {
      return { status: 'ok', latencyMs: await this.prisma.ping() };
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Falha desconhecida',
      };
    }
  }

  /** O serviço só está `ok` se todas as dependências estiverem `ok`. */
  private aggregate(checks: HealthResponse['checks']): HealthStatus {
    const status = Object.values(checks).map((check) => check.status);
    if (status.includes('down')) return 'down';
    if (status.includes('degraded')) return 'degraded';
    return 'ok';
  }
}
