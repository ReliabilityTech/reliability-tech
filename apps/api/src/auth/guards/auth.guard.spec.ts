import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const criarContexto = (request: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    }) as unknown as ExecutionContext;

  const criarGuard = (isPublic: boolean, verifyAsync: jest.Mock) => {
    const jwtService = { verifyAsync };
    const config = { get: jest.fn().mockReturnValue('segredo-de-teste') };
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(isPublic) };

    return new AuthGuard(jwtService as any, config as any, reflector as any);
  };

  it('libera rotas marcadas como públicas sem checar token', async () => {
    const guard = criarGuard(true, jest.fn());
    const contexto = criarContexto({ cookies: {}, headers: {} });

    await expect(guard.canActivate(contexto)).resolves.toBe(true);
  });

  it('rejeita quando não há token em cookie nem em Authorization', async () => {
    const guard = criarGuard(false, jest.fn());
    const contexto = criarContexto({ cookies: {}, headers: {} });

    await expect(guard.canActivate(contexto)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('aceita o token do cookie httpOnly e anexa o payload em req.user', async () => {
    const payload = { sub: 'user-1', tenantId: null, role: 'SUPER_ADMIN' };
    const verifyAsync = jest.fn().mockResolvedValue(payload);
    const guard = criarGuard(false, verifyAsync);
    const request = { cookies: { arbora_access: 'token-valido' }, headers: {} };

    await expect(guard.canActivate(criarContexto(request))).resolves.toBe(true);
    expect(request).toHaveProperty('user', payload);
  });

  it('aceita o token via Authorization Bearer quando não há cookie', async () => {
    const payload = { sub: 'user-1', tenantId: 't1', role: 'PROFESSOR' };
    const verifyAsync = jest.fn().mockResolvedValue(payload);
    const guard = criarGuard(false, verifyAsync);
    const request = { cookies: {}, headers: { authorization: 'Bearer token-valido' } };

    await guard.canActivate(criarContexto(request));
    expect(verifyAsync).toHaveBeenCalledWith('token-valido', expect.anything());
  });

  it('rejeita quando o token é inválido ou expirado', async () => {
    const verifyAsync = jest.fn().mockRejectedValue(new Error('jwt expired'));
    const guard = criarGuard(false, verifyAsync);
    const request = { cookies: { arbora_access: 'token-expirado' }, headers: {} };

    await expect(guard.canActivate(criarContexto(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
