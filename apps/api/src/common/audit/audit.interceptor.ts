import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';
import { type Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { type AccessTokenPayload } from '../../auth/types/access-token-payload';
import { AUDIT_KEY, type AuditMetadata } from './audit.constants';
import { AuditService } from './audit.service';
import { getAuditContext } from './audit-context';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.getAllAndOverride<AuditMetadata | undefined>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!metadata) return next.handle();

    const request = context.switchToHttp().getRequest<Request & { user?: AccessTokenPayload }>();

    return next.handle().pipe(
      tap((response) => {
        // Em rotas @Public() (login/logout) o AuthGuard nunca roda, então
        // request.user não existe — cai para o corpo da resposta ou para o
        // contexto que o próprio handler tiver setado via setAuditContext.
        const userId =
          request.user?.sub ??
          getAuditContext(request)?.userId ??
          this.readResponseUserId(response);

        void this.auditService.record({
          action: metadata.action,
          entity: metadata.entity,
          entityId: this.resolveEntityId(request, response) ?? userId,
          userId,
          ip: request.ip,
        });
      }),
    );
  }

  private resolveEntityId(request: Request, response: unknown): string | undefined {
    if (typeof request.params?.id === 'string') return request.params.id;
    if (response && typeof response === 'object' && 'id' in response) {
      const { id } = response as { id: unknown };
      return typeof id === 'string' ? id : undefined;
    }
    return undefined;
  }

  private readResponseUserId(response: unknown): string | undefined {
    if (!response || typeof response !== 'object' || !('user' in response)) return undefined;
    const { user } = response as { user: unknown };
    if (!user || typeof user !== 'object' || !('id' in user)) return undefined;
    const { id } = user as { id: unknown };
    return typeof id === 'string' ? id : undefined;
  }
}
