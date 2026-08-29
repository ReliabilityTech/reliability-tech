import { type AuthSession, authSessionSchema } from '@arbora/contracts';
import { z } from 'zod';

import { apiFetch } from './api-client';

export function login(email: string, password: string): Promise<AuthSession> {
  return apiFetch('auth/login', {
    method: 'POST',
    schema: authSessionSchema,
    body: { email, password },
  });
}

/** Resposta é 204 sem corpo — `z.unknown()` aceita o `null` que o cliente sintetiza. */
export function logout(): Promise<unknown> {
  return apiFetch('auth/logout', { method: 'POST', schema: z.unknown() });
}
