import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { type Request } from 'express';
import { type Observable } from 'rxjs';

import { type AccessTokenPayload } from '../auth/types/access-token-payload';
import { tenantContextStorage } from './tenant-context';

/**
 * Roda depois do AuthGuard (interceptors executam depois de guards no Nest),
 * então `request.user` já existe pras rotas autenticadas. Muta o objeto que o
 * middleware Express em `main.ts` já abriu no `AsyncLocalStorage` — não abre
 * um novo escopo aqui, porque `next.handle()` é um Observable frio e o
 * `.run()` do ALS não teria garantia de cobrir a execução assíncrona real do
 * handler se fosse aberto só agora.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: AccessTokenPayload }>();
    const store = tenantContextStorage.getStore();

    if (store && request.user) {
      store.tenantId = request.user.tenantId;
      store.bypass = request.user.role === 'SUPER_ADMIN';
    }

    return next.handle();
  }
}
