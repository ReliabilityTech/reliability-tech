import { type ApiError, apiErrorSchema, ERROR_CODES } from '@arbora/contracts';
import { type z, type ZodTypeAny } from 'zod';

import { env } from './env';

export class ApiRequestError extends Error {
  constructor(readonly error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
  }

  get statusCode(): number {
    return this.error.statusCode;
  }

  get code(): string {
    return this.error.code;
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

/** Monta a URL final, descartando parâmetros vazios. */
export function buildUrl(path: string, params?: QueryParams, baseUrl = env.NEXT_PUBLIC_API_URL) {
  const base = baseUrl.replace(/\/+$/, '');
  const url = new URL(`${base}/${path.replace(/^\/+/, '')}`);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

/**
 * Normaliza uma resposta de erro. Se o corpo não seguir o envelope `ApiError`
 * (ex.: erro de um proxy), devolve um envelope sintético equivalente.
 */
export function toApiError(status: number, body: unknown): ApiError {
  const parsed = apiErrorSchema.safeParse(body);
  if (parsed.success) return parsed.data;

  return {
    statusCode: status,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'Não foi possível concluir a requisição. Tente novamente.',
    timestamp: new Date().toISOString(),
  };
}

export type ApiFetchOptions<TSchema extends ZodTypeAny> = Omit<RequestInit, 'body'> & {
  /** Schema de `@arbora/contracts` usado para validar a resposta. */
  schema: TSchema;
  params?: QueryParams;
  body?: unknown;
};

/**
 * Cliente HTTP único do front: injeta cabeçalhos padrão, converte erros em
 * `ApiRequestError` e valida a resposta contra o contrato compartilhado.
 */
export async function apiFetch<TSchema extends ZodTypeAny>(
  path: string,
  { schema, params, body, headers, ...init }: ApiFetchOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const response = await fetch(buildUrl(path, params), {
    ...init,
    // A sessão vive em cookies httpOnly (ver AuthController na API) — sem
    // isso o navegador não envia nem recebe `Set-Cookie` entre localhost:3000
    // e localhost:3333 (origens diferentes).
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(toApiError(response.status, payload));
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    // Contrato divergente entre API e front: falha explícita em vez de
    // propagar dados inesperados para a interface.
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
