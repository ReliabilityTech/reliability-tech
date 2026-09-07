import { z } from 'zod';

import { alunoStatusSchema, periodoTipoSchema } from './academico';
import { eventoTipoSchema } from './agenda';
import { idSchema, isoDateTimeSchema } from './common/primitives';
import { recadoDestinatarioSchema } from './comunicacao';
import { movimentacaoTipoSchema } from './movimentacao';
import { tenantStatusSchema } from './tenant';

/**
 * Schemas desta página são vistas compostas (joins/agregações) usadas pelas
 * telas — não espelham uma tabela 1:1 como os schemas em academico.ts,
 * comunicacao.ts etc. Ficam separados para não confundir "isto é uma
 * entidade" com "isto é o que uma tela precisa".
 */

// ---------------------------------------------------------------------------
// Alunos (RF-009, RF-011, RF-014)
// ---------------------------------------------------------------------------

export const alunoListItemSchema = z.object({
  id: idSchema,
  nome: z.string(),
  matricula: z.string(),
  turmaNome: z.string().nullable(),
  responsaveis: z.string(),
  /** Percentual 0–100 nos últimos 30 dias; null se não há registro de presença. */
  frequencia: z.number().min(0).max(100).nullable(),
  status: alunoStatusSchema,
});
export type AlunoListItem = z.infer<typeof alunoListItemSchema>;

export const alunoPerfilResponsavelSchema = z.object({
  id: idSchema,
  nome: z.string(),
  email: z.string(),
  parentesco: z.string(),
  podeRetirar: z.boolean(),
});

export const alunoPerfilEventoSchema = z.object({
  quando: isoDateTimeSchema,
  descricao: z.string(),
});
export type AlunoPerfilEvento = z.infer<typeof alunoPerfilEventoSchema>;

export const alunoPerfilSchema = z.object({
  id: idSchema,
  nome: z.string(),
  matricula: z.string(),
  turmaNome: z.string().nullable(),
  mediaGeral: z.number().nullable(),
  frequencia: z.number().min(0).max(100).nullable(),
  responsaveis: z.array(alunoPerfilResponsavelSchema),
  alertas: z.array(z.object({ titulo: z.string(), descricao: z.string() })),
  eventosRecentes: z.array(alunoPerfilEventoSchema),
});
export type AlunoPerfil = z.infer<typeof alunoPerfilSchema>;

export const criarAlunoRequestSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  dataNascimento: isoDateTimeSchema,
  matricula: z.string().trim().min(1).max(40),
  turmaId: idSchema.optional(),
});
export type CriarAlunoRequest = z.infer<typeof criarAlunoRequestSchema>;

// ---------------------------------------------------------------------------
// Turmas, disciplinas e professores (RF-009)
// ---------------------------------------------------------------------------

export const turmaListItemSchema = z.object({
  id: idSchema,
  nome: z.string(),
  serie: z.string(),
  anoLetivo: z.number().int(),
});
export type TurmaListItem = z.infer<typeof turmaListItemSchema>;

export const criarTurmaRequestSchema = z.object({
  nome: z.string().trim().min(1).max(80),
  serie: z.string().trim().min(1).max(80),
  anoLetivo: z.number().int().min(2000),
});
export type CriarTurmaRequest = z.infer<typeof criarTurmaRequestSchema>;

export const disciplinaListItemSchema = z.object({
  id: idSchema,
  nome: z.string(),
});
export type DisciplinaListItem = z.infer<typeof disciplinaListItemSchema>;

export const criarDisciplinaRequestSchema = z.object({
  nome: z.string().trim().min(1).max(120),
});
export type CriarDisciplinaRequest = z.infer<typeof criarDisciplinaRequestSchema>;

export const professorListItemSchema = z.object({
  id: idSchema,
  name: z.string(),
  email: z.string(),
  createdAt: isoDateTimeSchema,
});
export type ProfessorListItem = z.infer<typeof professorListItemSchema>;

// ---------------------------------------------------------------------------
// Professor: turmas, notas, chamada (RF-010, RF-012)
// ---------------------------------------------------------------------------

export const turmaDisciplinaResumoSchema = z.object({
  id: idSchema,
  turmaId: idSchema,
  turmaNome: z.string(),
  disciplinaNome: z.string(),
});
export type TurmaDisciplinaResumo = z.infer<typeof turmaDisciplinaResumoSchema>;

export const periodoLetivoResumoSchema = z.object({
  id: idSchema,
  anoLetivo: z.number(),
  tipo: periodoTipoSchema,
  numero: z.number(),
});
export type PeriodoLetivoResumo = z.infer<typeof periodoLetivoResumoSchema>;

export const situacaoNotaSchema = z.enum(['APROVADO', 'ATENCAO', 'SEM_NOTA']);
export type SituacaoNota = z.infer<typeof situacaoNotaSchema>;

export const notaLancamentoItemSchema = z.object({
  alunoId: idSchema,
  alunoNome: z.string(),
  valor: z.number().min(0).max(10).nullable(),
  situacao: situacaoNotaSchema,
});
export type NotaLancamentoItem = z.infer<typeof notaLancamentoItemSchema>;

export const lancarNotaRequestSchema = z.object({
  alunoId: idSchema,
  turmaDisciplinaId: idSchema,
  periodoLetivoId: idSchema,
  valor: z
    .number({ invalid_type_error: 'Informe um número' })
    .min(0, 'A nota não pode ser negativa')
    .max(10, 'A nota máxima é 10'),
});
export type LancarNotaRequest = z.infer<typeof lancarNotaRequestSchema>;

export const presencaItemSchema = z.object({
  alunoId: idSchema,
  alunoNome: z.string(),
  presente: z.boolean(),
});
export type PresencaItem = z.infer<typeof presencaItemSchema>;

export const registrarPresencasRequestSchema = z.object({
  turmaDisciplinaId: idSchema,
  data: z.string().date(),
  registros: z.array(z.object({ alunoId: idSchema, presente: z.boolean() })).min(1),
});
export type RegistrarPresencasRequest = z.infer<typeof registrarPresencasRequestSchema>;

// ---------------------------------------------------------------------------
// Comunicados (RF-015 a RF-018)
// ---------------------------------------------------------------------------

export const recadoListItemSchema = z.object({
  id: idSchema,
  titulo: z.string(),
  destinatarioLabel: z.string(),
  autorNome: z.string(),
  publicadoEm: isoDateTimeSchema,
  /** null quando o destinatário não gera confirmação de leitura individual (ex.: toda a instituição sem responsáveis mapeados). */
  leituraPercentual: z.number().min(0).max(100).nullable(),
});
export type RecadoListItem = z.infer<typeof recadoListItemSchema>;

export const criarRecadoRequestSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, 'Informe um título')
    .max(200, 'O título pode ter no máximo 200 caracteres'),
  corpo: z.string().trim().min(1, 'Informe a mensagem'),
  destinatario: recadoDestinatarioSchema,
  turmaId: idSchema.nullable().optional(),
  alunoId: idSchema.nullable().optional(),
});
export type CriarRecadoRequest = z.infer<typeof criarRecadoRequestSchema>;

// ---------------------------------------------------------------------------
// Agenda (RF-024 a RF-027)
// ---------------------------------------------------------------------------

export const eventoCalendarioSchema = z.object({
  id: idSchema,
  titulo: z.string(),
  tipo: eventoTipoSchema,
  dataInicio: isoDateTimeSchema,
  dataFim: isoDateTimeSchema.nullable(),
  turmaNome: z.string().nullable(),
});
export type EventoCalendario = z.infer<typeof eventoCalendarioSchema>;

export const criarEventoRequestSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, 'Informe um título')
    .max(200, 'O título pode ter no máximo 200 caracteres'),
  descricao: z.string().trim().nullable().optional(),
  tipo: eventoTipoSchema,
  dataInicio: isoDateTimeSchema,
  dataFim: isoDateTimeSchema.nullable().optional(),
  turmaId: idSchema.nullable().optional(),
});
export type CriarEventoRequest = z.infer<typeof criarEventoRequestSchema>;

// ---------------------------------------------------------------------------
// Responsável (RF-019 a RF-023)
// ---------------------------------------------------------------------------

export const responsavelAlunoResumoSchema = z.object({
  id: idSchema,
  nome: z.string(),
});
export type ResponsavelAlunoResumo = z.infer<typeof responsavelAlunoResumoSchema>;

export const movimentacaoItemSchema = z.object({
  id: idSchema,
  tipo: movimentacaoTipoSchema,
  quando: isoDateTimeSchema,
});
export type MovimentacaoItem = z.infer<typeof movimentacaoItemSchema>;

// ---------------------------------------------------------------------------
// Super-Admin (RF-006 a RF-008)
// ---------------------------------------------------------------------------

export const tenantListItemSchema = z.object({
  id: idSchema,
  nome: z.string(),
  plano: z.string(),
  status: tenantStatusSchema,
  totalAlunos: z.number().int().min(0),
  createdAt: isoDateTimeSchema,
});
export type TenantListItem = z.infer<typeof tenantListItemSchema>;

export const atualizarStatusTenantRequestSchema = z.object({
  status: tenantStatusSchema,
});
export type AtualizarStatusTenantRequest = z.infer<typeof atualizarStatusTenantRequestSchema>;

export const criarTenantRequestSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen'),
  plano: z.string().trim().min(1).max(40),
  logoUrl: z.string().url().max(500).optional(),
  corPrimaria: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use um hexadecimal no formato #RRGGBB')
    .optional(),
});
export type CriarTenantRequest = z.infer<typeof criarTenantRequestSchema>;

// ---------------------------------------------------------------------------
// Dashboards agregados
// ---------------------------------------------------------------------------

export const dashboardAdminAlunoAtencaoSchema = z.object({
  alunoId: idSchema,
  nome: z.string(),
  turmaNome: z.string().nullable(),
  frequencia: z.number().min(0).max(100),
});

export const dashboardAdminAtividadeSchema = z.object({
  descricao: z.string(),
  quando: isoDateTimeSchema,
});

export const dashboardAdminResponseSchema = z.object({
  totalAlunos: z.number().int().min(0),
  frequenciaMedia: z.number().min(0).max(100).nullable(),
  faltasHoje: z.number().int().min(0),
  comunicadosRecentes: z.number().int().min(0),
  atencaoNecessaria: z.array(dashboardAdminAlunoAtencaoSchema),
  atividadesRecentes: z.array(dashboardAdminAtividadeSchema),
});
export type DashboardAdminResponse = z.infer<typeof dashboardAdminResponseSchema>;

export const dashboardSuperAdminResponseSchema = z.object({
  instituicoesAtivas: z.number().int().min(0),
  instituicoesSuspensas: z.number().int().min(0),
  totalAlunos: z.number().int().min(0),
});
export type DashboardSuperAdminResponse = z.infer<typeof dashboardSuperAdminResponseSchema>;

export const dashboardProfessorResponseSchema = z.object({
  turmasDisciplinas: z.array(turmaDisciplinaResumoSchema),
});
export type DashboardProfessorResponse = z.infer<typeof dashboardProfessorResponseSchema>;
