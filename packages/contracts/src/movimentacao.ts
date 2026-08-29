import { z } from 'zod';

import { idSchema, isoDateTimeSchema, timestampsSchema } from './common/primitives';

/** Pessoa pré-autorizada por um responsável a retirar o aluno (RF-023). */
export const terceiroAutorizadoSchema = z
  .object({
    id: idSchema,
    alunoId: idSchema,
    nome: z.string().trim().min(2).max(160),
    documento: z.string().trim().min(1).max(20),
    parentescoOuRelacao: z.string().trim().min(1).max(40),
    cadastradoPorId: idSchema,
  })
  .extend(timestampsSchema.shape);

export type TerceiroAutorizado = z.infer<typeof terceiroAutorizadoSchema>;

export const movimentacaoTipoSchema = z.enum(['ENTRADA', 'SAIDA']);
export type MovimentacaoTipo = z.infer<typeof movimentacaoTipoSchema>;

/** Entrada/saída na instituição (RF-020); notifica o responsável (RF-021). */
export const movimentacaoSchema = z.object({
  id: idSchema,
  alunoId: idSchema,
  tipo: movimentacaoTipoSchema,
  dataHora: isoDateTimeSchema,
  observacao: z.string().max(280).nullable(),
  retiradoPorTerceiroId: idSchema.nullable(),
  registradoPorId: idSchema,
});

export type Movimentacao = z.infer<typeof movimentacaoSchema>;

export const ocorrenciaTipoSchema = z.enum(['DISCIPLINAR', 'SAUDE']);
export type OcorrenciaTipo = z.infer<typeof ocorrenciaTipoSchema>;

/** Ocorrência disciplinar ou de saúde, visível ao responsável (RF-022). */
export const ocorrenciaSchema = z
  .object({
    id: idSchema,
    alunoId: idSchema,
    tipo: ocorrenciaTipoSchema,
    descricao: z.string().trim().min(1),
    dataHora: isoDateTimeSchema,
    registradoPorId: idSchema,
  })
  .extend(timestampsSchema.shape);

export type Ocorrencia = z.infer<typeof ocorrenciaSchema>;
