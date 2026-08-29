import { z } from 'zod';

import { idSchema, isoDateTimeSchema, timestampsSchema } from './common/primitives';

// ---------------------------------------------------------------------------
// Turmas e disciplinas (RF-009)
// ---------------------------------------------------------------------------

export const turmaSchema = z
  .object({
    id: idSchema,
    tenantId: idSchema,
    nome: z.string().trim().min(1).max(80),
    serie: z.string().trim().min(1).max(80),
    anoLetivo: z.number().int().min(2000),
  })
  .extend(timestampsSchema.shape);

export type Turma = z.infer<typeof turmaSchema>;

export const disciplinaSchema = z
  .object({
    id: idSchema,
    tenantId: idSchema,
    nome: z.string().trim().min(1).max(120),
  })
  .extend(timestampsSchema.shape);

export type Disciplina = z.infer<typeof disciplinaSchema>;

/** Liga uma disciplina a uma turma e ao professor responsável (RF-010, RF-012). */
export const turmaDisciplinaSchema = z.object({
  id: idSchema,
  turmaId: idSchema,
  disciplinaId: idSchema,
  professorId: idSchema,
  createdAt: isoDateTimeSchema,
});

export type TurmaDisciplina = z.infer<typeof turmaDisciplinaSchema>;

// ---------------------------------------------------------------------------
// Período letivo (RF-010: "notas por disciplina/bimestre/trimestre")
// ---------------------------------------------------------------------------

export const periodoTipoSchema = z.enum(['BIMESTRE', 'TRIMESTRE']);
export type PeriodoTipo = z.infer<typeof periodoTipoSchema>;

export const periodoLetivoSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  anoLetivo: z.number().int().min(2000),
  tipo: periodoTipoSchema,
  numero: z.number().int().min(1).max(4),
  dataInicio: isoDateTimeSchema,
  dataFim: isoDateTimeSchema,
});

export type PeriodoLetivo = z.infer<typeof periodoLetivoSchema>;

// ---------------------------------------------------------------------------
// Aluno e vínculo com responsáveis (RF-004, RF-005, RF-009)
// ---------------------------------------------------------------------------

export const alunoStatusSchema = z.enum(['ATIVO', 'INATIVO']);
export type AlunoStatus = z.infer<typeof alunoStatusSchema>;

export const alunoSchema = z
  .object({
    id: idSchema,
    tenantId: idSchema,
    nome: z.string().trim().min(2).max(160),
    dataNascimento: isoDateTimeSchema,
    matricula: z.string().trim().min(1).max(40),
    status: alunoStatusSchema,
    turmaId: idSchema.nullable(),
  })
  .extend(timestampsSchema.shape);

export type Aluno = z.infer<typeof alunoSchema>;

/** N:N — um aluno pode ter vários responsáveis e vice-versa (RF-004, RF-005). */
export const alunoResponsavelSchema = z.object({
  id: idSchema,
  alunoId: idSchema,
  responsavelId: idSchema,
  parentesco: z.string().trim().min(1).max(40),
  podeRetirar: z.boolean(),
  createdAt: isoDateTimeSchema,
});

export type AlunoResponsavel = z.infer<typeof alunoResponsavelSchema>;

// ---------------------------------------------------------------------------
// Notas e presença (RF-010 a RF-014)
// ---------------------------------------------------------------------------

export const notaSchema = z
  .object({
    id: idSchema,
    alunoId: idSchema,
    turmaDisciplinaId: idSchema,
    periodoLetivoId: idSchema,
    /** Escala 0–10 com 2 casas decimais — ver comentário em schema.prisma. */
    valor: z.number().min(0).max(10),
    lancadoPorId: idSchema,
  })
  .extend(timestampsSchema.shape);

export type Nota = z.infer<typeof notaSchema>;

export const presencaStatusSchema = z.enum(['PRESENTE', 'FALTA']);
export type PresencaStatus = z.infer<typeof presencaStatusSchema>;

/** `turmaDisciplinaId` nulo = falta lançada para o dia letivo inteiro (RF-012). */
export const presencaSchema = z.object({
  id: idSchema,
  alunoId: idSchema,
  data: isoDateTimeSchema,
  status: presencaStatusSchema,
  turmaDisciplinaId: idSchema.nullable(),
  registradoPorId: idSchema,
  createdAt: isoDateTimeSchema,
});

export type Presenca = z.infer<typeof presencaSchema>;
