import { type UserRole } from '@arbora/contracts';
import { SetMetadata } from '@nestjs/common';

import { ROLES_KEY } from '../auth.constants';

/** Restringe uma rota aos papéis informados — checado por `RolesGuard`. */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
