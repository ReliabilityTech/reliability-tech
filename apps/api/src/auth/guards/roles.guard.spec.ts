import { type ExecutionContext, ForbiddenException } from '@nestjs/common';

import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const criarContexto = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => undefined,
      getClass: () => undefined,
    }) as unknown as ExecutionContext;

  const criarGuard = (allowedRoles: string[] | undefined) => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(allowedRoles) };

    return new RolesGuard(reflector as any);
  };

  it('libera a rota quando não há @Roles definido', () => {
    const guard = criarGuard(undefined);
    expect(guard.canActivate(criarContexto({ role: 'RESPONSAVEL' }))).toBe(true);
  });

  it('libera quando o papel do usuário está na lista permitida', () => {
    const guard = criarGuard(['ADMIN_ESCOLAR', 'COORDENACAO']);
    expect(guard.canActivate(criarContexto({ role: 'COORDENACAO' }))).toBe(true);
  });

  it('rejeita quando o papel do usuário não está na lista permitida', () => {
    const guard = criarGuard(['ADMIN_ESCOLAR']);
    expect(() => guard.canActivate(criarContexto({ role: 'RESPONSAVEL' }))).toThrow(
      ForbiddenException,
    );
  });

  it('rejeita quando não há usuário autenticado no request', () => {
    const guard = criarGuard(['ADMIN_ESCOLAR']);
    expect(() => guard.canActivate(criarContexto(undefined))).toThrow(ForbiddenException);
  });
});
