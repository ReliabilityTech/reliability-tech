import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { type Request } from 'express';

import { type Env } from '../../config/env';
import { ACCESS_TOKEN_COOKIE, IS_PUBLIC_KEY } from '../auth.constants';
import { type AccessTokenPayload } from '../types/access-token-payload';

/**
 * Valida o token de acesso (cookie httpOnly, com fallback para
 * `Authorization: Bearer` — útil para testar pela documentação OpenAPI) e
 * anexa o payload em `req.user`. Rotas marcadas com `@Public()` são ignoradas.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AccessTokenPayload }>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Sessão ausente ou expirada');
    }

    try {
      request.user = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.get('JWT_SECRET', { infer: true }),
      });
      return true;
    } catch {
      throw new UnauthorizedException('Sessão ausente ou expirada');
    }
  }

  private extractToken(request: Request): string | undefined {
    const fromCookie = (request.cookies as Record<string, string> | undefined)?.[
      ACCESS_TOKEN_COOKIE
    ];
    if (fromCookie) return fromCookie;

    const header = request.headers.authorization;
    return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  }
}
