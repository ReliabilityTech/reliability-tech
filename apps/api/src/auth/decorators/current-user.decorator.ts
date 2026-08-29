import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';

import { type AccessTokenPayload } from '../types/access-token-payload';

/** Extrai o usuário autenticado anexado pelo `AuthGuard` em `req.user`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AccessTokenPayload }>();
    if (!request.user) {
      throw new Error('CurrentUser usado numa rota sem AuthGuard');
    }
    return request.user;
  },
);
