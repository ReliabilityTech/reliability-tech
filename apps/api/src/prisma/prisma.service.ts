import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

import { type Env } from '../config/env';
import { withTenantRls } from './tenant-rls.extension';

/**
 * Composição, não herança: `$extends()` (usado pra RLS, ver tenant-rls.extension.ts)
 * não combina de forma confiável com uma classe que estende `PrismaClient` e
 * adiciona métodos próprios como `ping()` — a própria documentação do Prisma
 * marca isso como arriscado. `db` é o client de verdade; todo service injeta
 * `PrismaService` e chama `this.prisma.db.<model>` (ou `.$transaction`/
 * `.$queryRaw`), nunca os métodos do client direto em `this.prisma`.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  readonly db: ReturnType<typeof PrismaService.criarClient>;

  constructor(config: ConfigService<Env, true>) {
    this.db = PrismaService.criarClient(config.get('APP_DATABASE_URL', { infer: true }));
  }

  private static criarClient(url: string) {
    return new PrismaClient({ datasources: { db: { url } } }).$extends(withTenantRls());
  }

  async onModuleInit(): Promise<void> {
    await this.db.$connect();
    this.logger.log('Conexão com o banco estabelecida');
  }

  async onModuleDestroy(): Promise<void> {
    await this.db.$disconnect();
  }

  /** Ping usado pelo health check para medir a latência do banco. */
  async ping(): Promise<number> {
    const inicio = Date.now();
    await this.db.$queryRaw`SELECT 1`;
    return Date.now() - inicio;
  }
}
