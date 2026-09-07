import { ForbiddenException } from '@nestjs/common';

import { type AccessTokenPayload } from '../auth/types/access-token-payload';

/**
 * Todo endpoint de dominio de escola exige tenantId — só SUPER_ADMIN opera
 * sem um (RF-008), e nenhuma rota de dominio permite esse papel. Se isso
 * disparar, é bug de roteamento (RolesGuard deveria ter barrado antes).
 */
export function requireTenantId(user: AccessTokenPayload): string {
  if (!user.tenantId) {
    throw new ForbiddenException('Este recurso exige um usuário vinculado a uma instituição');
  }
  return user.tenantId;
}
