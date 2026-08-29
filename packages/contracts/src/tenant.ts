import { z } from 'zod';

import { idSchema, timestampsSchema } from './common/primitives';

/** Uma instituição de ensino isolada das demais (RF-006 a RF-008; ver ADR 0006). */
export const tenantStatusSchema = z.enum(['ATIVO', 'SUSPENSO']);
export type TenantStatus = z.infer<typeof tenantStatusSchema>;

export const tenantSchema = z
  .object({
    id: idSchema,
    nome: z.string().trim().min(2).max(160),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen'),
    status: tenantStatusSchema,
    plano: z.string().trim().min(1).max(40),
    logoUrl: z.string().url().max(500).nullable(),
    corPrimaria: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Use um hexadecimal no formato #RRGGBB')
      .nullable(),
    mensagensDiretasHabilitadas: z.boolean(),
  })
  .extend(timestampsSchema.shape);

export type Tenant = z.infer<typeof tenantSchema>;
