import { type CriarTurmaRequest } from '@arbora/contracts';
import { z } from 'zod';

import { apiFetch } from './api-client';

export function criarTurma(body: CriarTurmaRequest): Promise<{ id: string }> {
  return apiFetch('turmas', { method: 'POST', schema: z.object({ id: z.string() }), body });
}
