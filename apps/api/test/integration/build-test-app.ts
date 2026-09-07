import { type INestApplication, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { type NextFunction, type Request, type Response } from 'express';

import { AppModule } from '../../src/app.module';
import { tenantContextStorage } from '../../src/common/tenant-context';
import { type Env } from '../../src/config/env';

/**
 * Replica só o que muda o comportamento HTTP observável em main.ts
 * (prefixo/versão de rota, cookies httpOnly do login) — helmet/Swagger não
 * afetam nenhuma asserção de teste. O middleware do AsyncLocalStorage
 * (roadmap 6.2) precisa estar aqui também: sem ele, `TenantContextInterceptor`
 * nunca acha um `store` pra preencher, e a extensão RLS nunca vê contexto
 * nenhum — toda query cai no fail-closed, mesmo pra uma requisição
 * autenticada legítima.
 */
export async function buildTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  const config = app.get(ConfigService<Env, true>);

  app.use(cookieParser());
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    tenantContextStorage.run({ tenantId: null, bypass: false }, next);
  });
  app.setGlobalPrefix(config.get('API_PREFIX', { infer: true }));
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  await app.init();
  return app;
}
