import { type LancarNotaRequest, type RegistrarPresencasRequest } from '@arbora/contracts';
import { z } from 'zod';

import { apiFetch } from './api-client';

export function lancarNota(body: LancarNotaRequest): Promise<{ id: string }> {
  return apiFetch('professor/notas', {
    method: 'PUT',
    schema: z.object({ id: z.string() }),
    body,
  });
}

export function registrarPresencas(
  body: RegistrarPresencasRequest,
): Promise<{ registrados: number }> {
  return apiFetch('professor/presencas', {
    method: 'PUT',
    schema: z.object({ registrados: z.number() }),
    body,
  });
}
