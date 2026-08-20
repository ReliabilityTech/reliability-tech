import { z } from 'zod';

/** Identificador de recurso. CUID2 é o padrão gerado pelo Prisma neste projeto. */
export const idSchema = z.string().min(1);
export type Id = z.infer<typeof idSchema>;

export const emailSchema = z.string().trim().toLowerCase().email('E-mail inválido');

/** Data/hora sempre trafega em ISO-8601 UTC entre API e clientes. */
export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const timestampsSchema = z.object({
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
