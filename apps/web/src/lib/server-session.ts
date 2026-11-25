import { authSessionSchema, type User } from '@arbora/contracts';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getServerApiBase } from './api-base';
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

  const response = await fetch(buildUrl('auth/me', undefined, getServerApiBase()), {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!response.ok) return null;

  const parsed = authSessionSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data.user : null;
}

/**
 * Espelha o RolesGuard da API no front: página não listada em `roles` manda
 * o usuário de volta para o próprio dashboard em vez de renderizar.
 */
export async function requireRole(roles: User['role'][]): Promise<User> {
  const user = await getServerUser();
  if (!user) redirect('/login');
  if (!roles.includes(user.role)) redirect('/dashboard');
  return user;
}
