import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

const usuarioBase = {
  id: 'user-1',
  name: 'Ana Pereira',
  email: 'ana@colegio-arbora.local',
  passwordHash: 'hash-fake',
  role: 'RESPONSAVEL' as const,
  tenantId: 'tenant-1',
  isActive: true,
  deletedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('AuthService', () => {
  const criarServico = async (overrides?: {
    prisma?: Record<string, unknown>;
    jwt?: Record<string, unknown>;
    password?: Record<string, unknown>;
  }) => {
    const db = {
      user: { findUnique: jest.fn() },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      ...overrides?.prisma,
    };
    const jwt = { signAsync: jest.fn().mockResolvedValue('access-token-fake'), ...overrides?.jwt };
    const password = { verify: jest.fn().mockResolvedValue(true), ...overrides?.password };
    const config = { get: jest.fn().mockReturnValue(30) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { db } },
        { provide: JwtService, useValue: jwt },
        { provide: PasswordService, useValue: password },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    return { service: moduleRef.get(AuthService), prisma: db, jwt, password };
  };

  describe('login', () => {
    it('emite tokens e retorna o usuário quando as credenciais são válidas', async () => {
      const { service, prisma } = await criarServico();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...usuarioBase, tenant: null });

      const { tokens, user } = await service.login(
        'ana@colegio-arbora.local',
        'SenhaForte2026',
        false,
      );

      expect(tokens.accessToken).toBe('access-token-fake');
      expect(tokens.refreshToken).toEqual(expect.any(String));
      expect(user.id).toBe('user-1');
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('propaga rememberMe para o RefreshToken criado', async () => {
      const { service, prisma } = await criarServico();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...usuarioBase, tenant: null });

      const { tokens } = await service.login(usuarioBase.email, 'SenhaForte2026', true);

      expect(tokens.rememberMe).toBe(true);
      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ rememberMe: true }) }),
      );
    });

    it('rejeita quando o usuário não existe', async () => {
      const { service, prisma } = await criarServico();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login('inexistente@colegio-arbora.local', 'x', false),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita quando o usuário está inativo', async () => {
      const { service, prisma } = await criarServico();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...usuarioBase,
        isActive: false,
        tenant: null,
      });

      await expect(service.login(usuarioBase.email, 'x', false)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejeita quando o tenant do usuário está suspenso', async () => {
      const { service, prisma } = await criarServico();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...usuarioBase,
        tenant: { status: 'SUSPENSO' },
      });

      await expect(service.login(usuarioBase.email, 'x', false)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejeita quando a senha está incorreta', async () => {
      const { service, prisma } = await criarServico({
        password: { verify: jest.fn().mockResolvedValue(false) },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...usuarioBase, tenant: null });

      await expect(service.login(usuarioBase.email, 'errada', false)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('rotaciona o token: revoga o atual e emite um novo', async () => {
      const { service, prisma } = await criarServico();
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        rememberMe: true,
        user: usuarioBase,
      });

      const { tokens } = await service.refresh('token-bruto-valido');

      expect(tokens.rememberMe).toBe(true);

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('rejeita um refresh token que não existe', async () => {
      const { service, prisma } = await criarServico();
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.refresh('token-desconhecido')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejeita um refresh token já revogado', async () => {
      const { service, prisma } = await criarServico();
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        user: usuarioBase,
      });

      await expect(service.refresh('token-revogado')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita um refresh token expirado', async () => {
      const { service, prisma } = await criarServico();
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1_000),
        user: usuarioBase,
      });

      await expect(service.refresh('token-expirado')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revoga o refresh token informado e retorna o id do dono', async () => {
      const { service, prisma } = await criarServico();
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        revokedAt: null,
        user: usuarioBase,
      });

      await expect(service.logout('token-bruto')).resolves.toEqual({
        userId: 'user-1',
        tenantId: usuarioBase.tenantId,
      });

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('não faz nada e retorna undefined quando o token não existe', async () => {
      const { service, prisma } = await criarServico();
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.logout('token-desconhecido')).resolves.toBeUndefined();
      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    });

    it('é idempotente: token já revogado não gera nova revogação', async () => {
      const { service, prisma } = await criarServico();
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        revokedAt: new Date(),
      });

      await expect(service.logout('token-ja-revogado')).resolves.toBeUndefined();
      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    });
  });
});
