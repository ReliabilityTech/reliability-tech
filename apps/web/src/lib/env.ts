import { z } from 'zod';

/**
 * Variáveis públicas do front. Precisam ser lidas de forma literal
 * (`process.env.NEXT_PUBLIC_X`) para que o Next consiga inliná-las no bundle.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL deve ser uma URL válida'),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('Arbora'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

function loadEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api/v1',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
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
