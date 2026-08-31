import {
  type NotaLancamentoItem,
  notaLancamentoItemSchema,
  type PeriodoLetivoResumo,
  periodoLetivoResumoSchema,
  type PresencaItem,
  presencaItemSchema,
  type TurmaDisciplinaResumo,
  turmaDisciplinaResumoSchema,
} from '@arbora/contracts';
import { z } from 'zod';

import { serverFetch } from './server-api';

export function listarTurmasProfessor(): Promise<TurmaDisciplinaResumo[]> {
  return serverFetch('professor/turmas', { schema: z.array(turmaDisciplinaResumoSchema) });
}

export function listarPeriodos(): Promise<PeriodoLetivoResumo[]> {
  return serverFetch('professor/periodos', { schema: z.array(periodoLetivoResumoSchema) });
}

export function listarNotas(
  turmaDisciplinaId: string,
  periodoLetivoId: string,
): Promise<NotaLancamentoItem[]> {
  return serverFetch(`professor/turmas/${turmaDisciplinaId}/notas`, {
    schema: z.array(notaLancamentoItemSchema),
    params: { periodoLetivoId },
  });
}

export function listarPresencas(turmaDisciplinaId: string, data: string): Promise<PresencaItem[]> {
  return serverFetch(`professor/turmas/${turmaDisciplinaId}/presencas`, {
    schema: z.array(presencaItemSchema),
    params: { data },
  });
}
