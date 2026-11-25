import { z } from 'zod';

/**
 * Variáveis públicas do front. Precisam ser lidas de forma literal
 * (`process.env.NEXT_PUBLIC_X`) para que o Next consiga inliná-las no bundle.
 */
const clientEnvSchema = z.object({
  /** URL absoluta (dev) ou caminho começando com `/` (proxy do Next, ver api-base.ts). */
  NEXT_PUBLIC_API_URL: z
    .string()
    .refine(
      (value) => value.startsWith('/') || z.string().url().safeParse(value).success,
      'NEXT_PUBLIC_API_URL deve ser uma URL válida ou um caminho iniciado por "/"',
    ),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('Arbora'),
  /**
   * Opcional: sem valor, monitoramento de erro fica desligado (RNF —
   * roadmap 5.4). Documentado aqui, mas quem lê de verdade são os
   * sentry.*.config.ts direto de `process.env` — rodam antes desse módulo
   * no ciclo de instrumentação do Next. `preprocess` trata "" como ausente:
   * um ARG de Docker sem --build-arg vira string vazia, não undefined (ver
   * apps/web/Dockerfile), e sem isso `.url()` rejeitaria a string vazia.
   */
  NEXT_PUBLIC_SENTRY_DSN: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().url().optional(),
  ),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

function loadEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api/v1',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });

  if (!result.success) {
    const detalhes = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuração do front inválida — ${detalhes}`);
  }

  return result.data;
}

export const env = loadEnv();
