import { type TurmaListItem, turmaListItemSchema } from '@arbora/contracts';
import { z } from 'zod';

import { serverFetch } from './server-api';

export function listarTurmas(): Promise<TurmaListItem[]> {
  return serverFetch('turmas', { schema: z.array(turmaListItemSchema) });
}
