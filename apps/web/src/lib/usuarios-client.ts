import { type RegisterRequest } from '@arbora/contracts';
import { z } from 'zod';

import { apiFetch } from './api-client';

export function criarProfessor(body: RegisterRequest): Promise<{ id: string }> {
  return apiFetch('usuarios', { method: 'POST', schema: z.object({ id: z.string() }), body });
}
