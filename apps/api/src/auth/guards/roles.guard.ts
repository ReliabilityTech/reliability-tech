import { type UserRole } from '@arbora/contracts';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';

import { ROLES_KEY } from '../auth.constants';
import { type AccessTokenPayload } from '../types/access-token-payload';

/** Roda depois do `AuthGuard`. Sem `@Roles(...)` na rota, não restringe nada. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowedRoles || allowedRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AccessTokenPayload }>();
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      throw new ForbiddenException('Papel do usuário não tem acesso a este recurso');
    }

    return true;
  }
}
