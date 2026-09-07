import { type CriarDisciplinaRequest } from '@arbora/contracts';
import { z } from 'zod';

import { apiFetch } from './api-client';

export function criarDisciplina(body: CriarDisciplinaRequest): Promise<{ id: string }> {
  return apiFetch('disciplinas', { method: 'POST', schema: z.object({ id: z.string() }), body });
}
