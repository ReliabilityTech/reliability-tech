import { type CriarAlunoRequest } from '@arbora/contracts';
import { z } from 'zod';

import { apiFetch } from './api-client';

export function criarAluno(body: CriarAlunoRequest): Promise<{ id: string }> {
  return apiFetch('alunos', { method: 'POST', schema: z.object({ id: z.string() }), body });
}
