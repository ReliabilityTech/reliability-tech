import { z } from 'zod';

import { idSchema, isoDateTimeSchema, timestampsSchema } from './common/primitives';

// ---------------------------------------------------------------------------
// Recados (RF-015 a RF-018)
// ---------------------------------------------------------------------------

export const recadoDestinatarioSchema = z.enum(['TODA_INSTITUICAO', 'TURMA', 'INDIVIDUAL']);
export type RecadoDestinatario = z.infer<typeof recadoDestinatarioSchema>;

export const recadoSchema = z
  .object({
    id: idSchema,
    tenantId: idSchema,
    titulo: z.string().trim().min(1).max(200),
    corpo: z.string().trim().min(1),
    destinatario: recadoDestinatarioSchema,
    /** Preenchido apenas quando `destinatario` é `TURMA`. */
    turmaId: idSchema.nullable(),
    /** Preenchido apenas quando `destinatario` é `INDIVIDUAL`. */
    alunoId: idSchema.nullable(),
    autorId: idSchema,
    publicadoEm: isoDateTimeSchema,
  })
  .extend(timestampsSchema.shape);

export type Recado = z.infer<typeof recadoSchema>;

/** Anexo de circular/autorização a um recado (RF-017). */
export const recadoAnexoSchema = z.object({
  id: idSchema,
  recadoId: idSchema,
  nomeArquivo: z.string().trim().min(1).max(255),
  url: z.string().url().max(500),
  tamanhoBytes: z.number().int().min(0),
  createdAt: isoDateTimeSchema,
});

export type RecadoAnexo = z.infer<typeof recadoAnexoSchema>;

/** Confirmação de leitura/ciência de um recado pelo responsável (RF-016). */
export const recadoConfirmacaoLeituraSchema = z.object({
  id: idSchema,
  recadoId: idSchema,
  responsavelId: idSchema,
  lidoEm: isoDateTimeSchema,
});

export type RecadoConfirmacaoLeitura = z.infer<typeof recadoConfirmacaoLeituraSchema>;

// ---------------------------------------------------------------------------
// Mensagens diretas (RF-019, opcional — ver Tenant.mensagensDiretasHabilitadas)
// ---------------------------------------------------------------------------

export const conversaSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  responsavelId: idSchema,
  staffId: idSchema,
  createdAt: isoDateTimeSchema,
});

export type Conversa = z.infer<typeof conversaSchema>;

export const mensagemSchema = z.object({
  id: idSchema,
  conversaId: idSchema,
  autorId: idSchema,
  corpo: z.string().trim().min(1),
  enviadoEm: isoDateTimeSchema,
  lidoEm: isoDateTimeSchema.nullable(),
});

export type Mensagem = z.infer<typeof mensagemSchema>;
