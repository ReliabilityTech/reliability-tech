import { type UserRole } from '@arbora/contracts';

/** Payload assinado no JWT de acesso — é o que os guards enxergam em `req.user`. */
export type AccessTokenPayload = {
  sub: string;
  tenantId: string | null;
  role: UserRole;
};
