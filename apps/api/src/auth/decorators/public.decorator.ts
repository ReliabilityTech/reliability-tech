import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY } from '../auth.constants';

/** Marca uma rota como isenta de `AuthGuard` (ex.: login, refresh, logout). */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
