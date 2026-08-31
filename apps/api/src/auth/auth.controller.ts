import { type AuthSession, loginRequestSchema } from '@arbora/contracts';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request, type Response } from 'express';

import { Audit } from '../common/audit/audit.decorator';
import { setAuditContext } from '../common/audit/audit-context';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { type Env } from '../config/env';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth.constants';
import { AuthService, type IssuedTokens } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { type AccessTokenPayload } from './types/access-token-payload';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Audit('LOGIN', 'User')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica com e-mail e senha, abre sessão em cookies httpOnly' })
  async login(
    @Body(new ZodValidationPipe(loginRequestSchema))
    body: { email: string; password: string; rememberMe: boolean },
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSession> {
    const { tokens, user } = await this.authService.login(
      body.email,
      body.password,
      body.rememberMe,
    );
    this.setSessionCookies(res, tokens);
    return this.authService.toSession(user);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotaciona o refresh token e emite um novo access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSession> {
    const rawRefreshToken = this.readRefreshCookie(req);
    const { tokens, user } = await this.authService.refresh(rawRefreshToken);
    this.setSessionCookies(res, tokens);
    return this.authService.toSession(user);
  }

  @Public()
  @Audit('LOGOUT', 'User')
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga o refresh token atual e limpa a sessão' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_TOKEN_COOKIE];
    const revogado = raw ? await this.authService.logout(raw) : undefined;
    if (revogado) {
      setAuditContext(req, { userId: revogado.userId, tenantId: revogado.tenantId ?? undefined });
    }
    this.clearSessionCookies(res);
  }

  @Get('me')
  @ApiOperation({ summary: 'Retorna o usuário da sessão atual' })
  async me(@CurrentUser() { sub }: AccessTokenPayload): Promise<AuthSession> {
    const user = await this.authService.me(sub);
    return this.authService.toSession(user);
  }

  private readRefreshCookie(req: Request): string {
    const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_TOKEN_COOKIE];
    if (!raw) throw new UnauthorizedException('Sessão inválida ou expirada');
    return raw;
  }

  private setSessionCookies(res: Response, tokens: IssuedTokens): void {
    const secure = this.config.get('NODE_ENV', { infer: true }) === 'production';

    // Sem `maxAge`: cookie de sessão — quem expira o acesso de fato é a
    // verificação de assinatura/exp do JWT no AuthGuard, não o navegador.
    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      // Sem "lembrar de mim": cookie de sessão, some ao fechar o navegador —
      // mesmo que o RefreshToken no banco continue válido por mais tempo.
      ...(tokens.rememberMe ? { expires: tokens.refreshTokenExpiresAt } : {}),
    });
  }

  private clearSessionCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }
}
