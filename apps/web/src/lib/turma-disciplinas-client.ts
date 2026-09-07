import { type CriarTurmaDisciplinaRequest } from '@arbora/contracts';
import { z } from 'zod';

import { apiFetch } from './api-client';

export function atribuirTurmaDisciplina(
  body: CriarTurmaDisciplinaRequest,
): Promise<{ id: string }> {
  return apiFetch('turma-disciplinas', {
    method: 'POST',
    schema: z.object({ id: z.string() }),
    body,
  });
}
