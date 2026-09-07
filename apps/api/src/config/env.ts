import { z } from 'zod';

/**
 * Toda variável de ambiente usada pela API é declarada aqui. A validação roda
 * no boot: falhar cedo evita subir um container com configuração inválida.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  API_PREFIX: z.string().default('api'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL de conexão válida'),
  /**
   * Conexão de runtime da API, com o papel restrito `arbora_app` — não o
   * superusuário `arbora` que `DATABASE_URL`/Prisma CLI usam pra migração.
   * Precisa ser um papel sem BYPASSRLS/não-superusuário pras políticas RLS
   * (roadmap 6.2, migração `20260907165617_rls_tenant_isolation`) valerem —
   * superusuário sempre ignora RLS, então usar `DATABASE_URL` aqui tornaria
   * a segunda camada de isolamento só encenação.
   */
  APP_DATABASE_URL: z.string().url('APP_DATABASE_URL deve ser uma URL de conexão válida'),

  /** Origens liberadas no CORS, separadas por vírgula. */
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  /** Segredo de assinatura dos tokens de sessão. Nunca versionar o valor real. */
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres'),
  /** Vida curta por design (ADR 0004) — a sessão longa vive no refresh token. */
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  /** Janela e limite do rate limit global (RNF de segurança). */
  RATE_LIMIT_TTL_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),

  SWAGGER_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),

  /**
   * Opcional: sem valor, monitoramento de erro fica desligado (RNF —
   * roadmap 5.4). Só declarado aqui pra validação/documentação — quem lê de
   * verdade é `instrument.ts`, direto de `process.env`, porque precisa
   * rodar antes do ConfigModule existir (ver comentário lá). `preprocess`
   * trata "" como ausente, mesmo raciocínio de NEXT_PUBLIC_SENTRY_DSN no web.
   */
  SENTRY_DSN: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().url().optional(),
  ),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const detalhes = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${detalhes}`);
  }

  return result.data;
}

export function parseCorsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
