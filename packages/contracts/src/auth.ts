import { z } from 'zod';

import { emailSchema, idSchema, isoDateTimeSchema } from './common/primitives';

/**
 * Papéis confirmados por RF-001 (ver docs/adr/0004-autenticacao-e-papeis.md).
 * Valores espelham o enum `UserRole` do Prisma — mesma convenção dos demais
 * enums do domínio em `@arbora/contracts`. `SUPER_ADMIN` não pertence a
 * tenant nenhum; os demais são escopados por tenant.
 */
export const userRoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN_ESCOLAR',
  'COORDENACAO',
  'PROFESSOR',
  'RESPONSAVEL',
]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const passwordSchema = z
  .string()
  .min(12, 'A senha deve ter ao menos 12 caracteres')
  .max(128, 'A senha deve ter no máximo 128 caracteres')
  .regex(/[a-z]/, 'A senha deve conter uma letra minúscula')
  .regex(/[A-Z]/, 'A senha deve conter uma letra maiúscula')
  .regex(/[0-9]/, 'A senha deve conter um número');

export const userSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  role: userRoleSchema,
  /** Nulo apenas para `SUPER_ADMIN` (RF-008), que opera fora de qualquer tenant. */
  tenantId: idSchema.nullable(),
  createdAt: isoDateTimeSchema,
});

export type User = z.infer<typeof userSchema>;

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
  /** Refresh token vira cookie de sessão (some ao fechar o navegador) quando falso. */
  rememberMe: z.boolean().default(false),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome completo').max(120),
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

/**
 * Resposta de login/refresh/`/auth/me`. Os tokens em si nunca trafegam no
 * corpo — vão em cookies httpOnly (ver AuthController), para reduzir a
 * superfície de roubo de token via XSS.
 */
export const authSessionSchema = z.object({
  user: userSchema,
});

export type AuthSession = z.infer<typeof authSessionSchema>;
