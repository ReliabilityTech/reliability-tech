import { type CriarEventoRequest } from '@arbora/contracts';
import { z } from 'zod';

import { apiFetch } from './api-client';

export function criarEvento(body: CriarEventoRequest): Promise<{ id: string }> {
  return apiFetch('eventos', { method: 'POST', schema: z.object({ id: z.string() }), body });
}
