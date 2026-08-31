import { ERROR_CODES } from '@arbora/contracts';
import { cookies } from 'next/headers';
import { type z, type ZodTypeAny } from 'zod';

import { ApiRequestError, buildUrl, type QueryParams, toApiError } from './api-client';

export type ServerFetchOptions<TSchema extends ZodTypeAny> = {
  schema: TSchema;
  params?: QueryParams;
  method?: string;
  body?: unknown;
};

/**
 * Equivalente a `apiFetch`, mas para Server Components: não há cookie jar do
 * navegador no servidor, então os cookies httpOnly da requisição atual
 * precisam ser repassados manualmente (mesma técnica de `getServerUser`).
 */
export async function serverFetch<TSchema extends ZodTypeAny>(
  path: string,
  { schema, params, method = 'GET', body }: ServerFetchOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  const response = await fetch(buildUrl(path, params), {
    method,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      cookie: cookieHeader,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(toApiError(response.status, payload));
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiRequestError({
      statusCode: response.status,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'A resposta da API não corresponde ao contrato esperado.',
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
      timestamp: new Date().toISOString(),
    });
  }

  return parsed.data;
}
