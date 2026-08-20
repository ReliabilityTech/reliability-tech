import { z } from 'zod';

import { emailSchema, idSchema, isoDateTimeSchema } from './common/primitives';

/**
 * Baseline de autenticação. Os papéis abaixo são uma hipótese de trabalho
 * (ver docs/adr/0004-autenticacao-e-papeis.md) e devem ser revisados assim que
 * os requisitos funcionais de perfis de acesso forem consolidados.
 */
export const userRoleSchema = z.enum(['admin', 'gestor', 'tecnico', 'leitor']);
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
  createdAt: isoDateTimeSchema,
});

export type User = z.infer<typeof userSchema>;

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome completo').max(120),
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const authSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: isoDateTimeSchema,
  user: userSchema,
});

export type AuthSession = z.infer<typeof authSessionSchema>;
