import { z } from 'zod';

import { idSchema, isoDateTimeSchema, timestampsSchema } from './common/primitives';

export const eventoTipoSchema = z.enum(['EVENTO', 'PROVA', 'REUNIAO', 'FERIADO']);
export type EventoTipo = z.infer<typeof eventoTipoSchema>;

/** Calendário escolar (RF-024 a RF-027). `turmaId` nulo = vale para toda a instituição. */
export const eventoSchema = z
  .object({
    id: idSchema,
    tenantId: idSchema,
    titulo: z.string().trim().min(1).max(200),
    descricao: z.string().nullable(),
    tipo: eventoTipoSchema,
    dataInicio: isoDateTimeSchema,
    dataFim: isoDateTimeSchema.nullable(),
    turmaId: idSchema.nullable(),
  })
  .extend(timestampsSchema.shape);

export type Evento = z.infer<typeof eventoSchema>;
