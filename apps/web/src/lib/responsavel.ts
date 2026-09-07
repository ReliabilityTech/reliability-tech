import {
  type MovimentacaoItem,
  movimentacaoItemSchema,
  type ResponsavelAlunoResumo,
  responsavelAlunoResumoSchema,
} from '@arbora/contracts';
import { z } from 'zod';

import { serverFetch } from './server-api';

export function listarAlunosDoResponsavel(): Promise<ResponsavelAlunoResumo[]> {
  return serverFetch('responsavel/alunos', { schema: z.array(responsavelAlunoResumoSchema) });
}

export function listarMovimentacoes(alunoId: string): Promise<MovimentacaoItem[]> {
  return serverFetch(`responsavel/alunos/${alunoId}/movimentacoes`, {
    schema: z.array(movimentacaoItemSchema),
  });
}
