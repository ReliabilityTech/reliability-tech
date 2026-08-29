import { z } from 'zod';

import { idSchema, isoDateTimeSchema } from './common/primitives';

export const notificacaoCanalSchema = z.enum(['PUSH', 'EMAIL', 'SMS', 'WHATSAPP']);
export type NotificacaoCanal = z.infer<typeof notificacaoCanalSchema>;

export const notificacaoTipoSchema = z.enum([
  'FALTA',
  'RECADO',
  'EVENTO',
  'MOVIMENTACAO',
  'OCORRENCIA',
]);
export type NotificacaoTipo = z.infer<typeof notificacaoTipoSchema>;

export const notificacaoStatusSchema = z.enum(['PENDENTE', 'ENVIADO', 'FALHOU']);
export type NotificacaoStatus = z.infer<typeof notificacaoStatusSchema>;

/**
 * Registro de tentativa de notificação multicanal, com fallback entre canais
 * quando um falha (RNF-019). `referenciaId` aponta para entidades diferentes
 * conforme `tipo` — resolvido pela aplicação, não é uma referência tipada aqui.
 */
export const notificacaoSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  destinatarioId: idSchema,
  canal: notificacaoCanalSchema,
  tipo: notificacaoTipoSchema,
  referenciaId: idSchema,
  status: notificacaoStatusSchema,
  enviadoEm: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
});

export type Notificacao = z.infer<typeof notificacaoSchema>;
