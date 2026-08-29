import { authSessionSchema, type User } from '@arbora/contracts';
import { cookies } from 'next/headers';

import { buildUrl } from './api-client';

/**
 * Lê a sessão a partir dos cookies httpOnly da requisição atual — usado em
 * Server Components, que rodam no servidor e não têm acesso a `document.cookie`.
 */
export async function getServerUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  const response = await fetch(buildUrl('auth/me'), {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!response.ok) return null;

  const parsed = authSessionSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data.user : null;
}
