import { type MovimentacaoItem, movimentacaoItemSchema } from '@arbora/contracts';
import { z } from 'zod';

import { apiFetch } from './api-client';

export function listarMovimentacoesClient(alunoId: string): Promise<MovimentacaoItem[]> {
  return apiFetch(`responsavel/alunos/${alunoId}/movimentacoes`, {
    schema: z.array(movimentacaoItemSchema),
  });
}
