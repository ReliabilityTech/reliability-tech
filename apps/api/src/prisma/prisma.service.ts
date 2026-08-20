import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conexão com o banco estabelecida');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Ping usado pelo health check para medir a latência do banco. */
  async ping(): Promise<number> {
    const inicio = Date.now();
    await this.$queryRaw`SELECT 1`;
    return Date.now() - inicio;
  }
}
