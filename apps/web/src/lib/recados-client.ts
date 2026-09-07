import { type CriarRecadoRequest } from '@arbora/contracts';
import { z } from 'zod';

import { apiFetch } from './api-client';

export function criarRecado(body: CriarRecadoRequest): Promise<{ id: string }> {
  return apiFetch('recados', { method: 'POST', schema: z.object({ id: z.string() }), body });
}
