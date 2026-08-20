import { z } from 'zod';

/**
 * Envelope único de erro da API. Todo endpoint que falha responde neste formato,
 * o que permite ao front tratar erros de forma genérica.
 */
export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  /** Código estável e legível por máquina, ex.: `VALIDATION_ERROR`. */
  code: z.string(),
  /** Mensagem destinada a pessoas, em pt-BR. */
  message: z.string(),
  /** Detalhes por campo, preenchido em erros de validação. */
  details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  /** Correlaciona a resposta com os logs do servidor. */
  requestId: z.string().optional(),
  timestamp: z.string(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
