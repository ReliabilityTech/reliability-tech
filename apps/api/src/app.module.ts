import { randomUUID } from 'node:crypto';

import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { type Env, validateEnv } from './config/env';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        // Rota explícita: o Nest 11 rejeita o curinga legado `*`.
        forRoutes: [{ path: '*path', method: RequestMethod.ALL }],
        pinoHttp: {
          level: config.get('LOG_LEVEL', { infer: true }),

          // Identificador de correlação. Reaproveita o `x-request-id` que vier
          // do proxy e devolve o valor no cabeçalho, para que o usuário possa
          // citá-lo ao reportar um erro. Precisa ser string: o padrão do
          // pino-http é um contador numérico, incompatível com `ApiError`.
          genReqId: (req, res) => {
            const recebido = req.headers['x-request-id'];
            const id = typeof recebido === 'string' && recebido ? recebido : randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          // Em desenvolvimento o log é humano; em produção, JSON para ingestão.
          transport:
            config.get('NODE_ENV', { infer: true }) === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true, translateTime: true } }
              : undefined,
          // Nunca registrar credenciais nem tokens (RNF de segurança/LGPD).
          redact: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password'],
          autoLogging: { ignore: (req) => req.url?.startsWith('/api/v1/health') ?? false },
        },
      }),
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        throttlers: [
          {
            ttl: config.get('RATE_LIMIT_TTL_MS', { infer: true }),
            limit: config.get('RATE_LIMIT_MAX', { infer: true }),
          },
        ],
      }),
    }),

    PrismaModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
