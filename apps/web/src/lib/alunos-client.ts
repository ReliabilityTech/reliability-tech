import { type CriarAlunoRequest, type VincularResponsavelRequest } from '@arbora/contracts';
import { z } from 'zod';

import { apiFetch } from './api-client';

export function criarAluno(body: CriarAlunoRequest): Promise<{ id: string }> {
  return apiFetch('alunos', { method: 'POST', schema: z.object({ id: z.string() }), body });
}

export function vincularResponsavel(
  alunoId: string,
  body: VincularResponsavelRequest,
): Promise<{ id: string }> {
  return apiFetch(`alunos/${alunoId}/responsaveis`, {
    method: 'POST',
    schema: z.object({ id: z.string() }),
    body,
  });
}

export function desvincularResponsavel(alunoId: string, responsavelId: string): Promise<null> {
  return apiFetch(`alunos/${alunoId}/responsaveis/${responsavelId}`, {
    method: 'DELETE',
    schema: z.null(),
  });
}
