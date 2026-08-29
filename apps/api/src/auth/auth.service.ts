import { createHash, randomBytes } from 'node:crypto';

import { type AuthSession, type User as UserContract } from '@arbora/contracts';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type User } from '@prisma/client';

import { type Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { type AccessTokenPayload } from './types/access-token-payload';

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  rememberMe: boolean;
};

const REFRESH_TOKEN_BYTES = 48;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async login(
    email: string,
    senha: string,
    rememberMe: boolean,
  ): Promise<{ tokens: IssuedTokens; user: User }> {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { tenant: true } });
    const credenciaisInvalidas = () => new UnauthorizedException('E-mail ou senha inválidos');

    if (!user || user.deletedAt || !user.isActive) {
      throw credenciaisInvalidas();
    }
    if (user.tenant && user.tenant.status !== 'ATIVO') {
      throw new UnauthorizedException('A instituição vinculada a este usuário está suspensa');
    }
    if (!(await this.passwordService.verify(user.passwordHash, senha))) {
      throw credenciaisInvalidas();
    }

    const tokens = await this.issueTokens(user, rememberMe);
    return { tokens, user };
  }

  async refresh(rawRefreshToken: string): Promise<{ tokens: IssuedTokens; user: User }> {
    const invalido = () => new UnauthorizedException('Sessão inválida ou expirada');
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw invalido();
    }
    if (stored.user.deletedAt || !stored.user.isActive) {
      throw invalido();
    }

    // Rotação: o token usado morre aqui, mesmo que a emissão do novo falhe.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(stored.user, stored.rememberMe);
    return { tokens, user: stored.user };
  }

  /** Retorna o id do usuário dono do token revogado, para o audit log (`@Public()` — sem `req.user`). */
  async logout(rawRefreshToken: string): Promise<string | undefined> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt) return undefined;

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return stored.userId;
  }

  async me(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
    return user;
  }

  toSession(user: User): AuthSession {
    return { user: this.toContractUser(user) };
  }

  private toContractUser(user: User): UserContract {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async issueTokens(user: User, rememberMe: boolean): Promise<IssuedTokens> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(
      refreshTokenExpiresAt.getDate() + this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: refreshTokenExpiresAt,
        rememberMe,
      },
    });

    return { accessToken, refreshToken, refreshTokenExpiresAt, rememberMe };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
