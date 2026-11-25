import './instrument';
import 'reflect-metadata';

import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { tenantContextStorage } from './common/tenant-context';
import { type Env, parseCorsOrigins } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<Env, true>);
  const prefix = config.get('API_PREFIX', { infer: true });

  const trustProxyHops = config.get('TRUST_PROXY_HOPS', { infer: true });
  if (trustProxyHops > 0) app.set('trust proxy', trustProxyHops);

  app.use(helmet());
  app.use(cookieParser());
  // Abre o escopo do AsyncLocalStorage pra cada requisição — o
  // TenantContextInterceptor preenche tenantId/bypass depois que o AuthGuard
  // roda (ver tenant-context.ts). Middleware Express, não interceptor: o
  // `next.handle()` do Nest é um Observable frio, então abrir o `.run()` só
  // no interceptor arriscaria o contexto não cobrir a execução assíncrona
  // real do handler.
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    tenantContextStorage.run({ tenantId: null, bypass: false }, next);
  });
  app.enableCors({
    origin: parseCorsOrigins(config.get('CORS_ORIGINS', { infer: true })),
    credentials: true,
  });

  app.setGlobalPrefix(prefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  // Fecha conexões (Prisma incluído) antes de o processo encerrar.
  app.enableShutdownHooks();

  if (config.get('SWAGGER_ENABLED', { infer: true })) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Arbora API')
        .setDescription('API da plataforma Arbora — Reliability Tech')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup(`${prefix}/docs`, app, document);
  }

  // O timeout padrão do Node (5s) fica perto demais do keep-alive do pool de
  // fetch do Next.js (server-api.ts): sob idle entre requisições, o cliente
  // pode reusar um socket que o servidor acabou de fechar, e a próxima
  // requisição estoura com "fetch failed" (ECONNRESET) do lado do Next —
  // visto em produção sintética via E2E (Fase 4.1). headersTimeout precisa
  // ficar acima de keepAliveTimeout (exigência do Node).
  const httpServer = app.getHttpServer() as { keepAliveTimeout: number; headersTimeout: number };
  httpServer.keepAliveTimeout = 65_000;
  httpServer.headersTimeout = 66_000;

  const port = config.get('PORT', { infer: true });
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
