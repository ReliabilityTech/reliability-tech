import { type ProfessorListItem, professorListItemSchema } from '@arbora/contracts';
import { z } from 'zod';

import { serverFetch } from './server-api';

export function listarProfessores(): Promise<ProfessorListItem[]> {
  return serverFetch('usuarios', { schema: z.array(professorListItemSchema) });
}
