import { type DisciplinaListItem, disciplinaListItemSchema } from '@arbora/contracts';
import { z } from 'zod';

import { serverFetch } from './server-api';

export function listarDisciplinas(): Promise<DisciplinaListItem[]> {
  return serverFetch('disciplinas', { schema: z.array(disciplinaListItemSchema) });
}
