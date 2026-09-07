import {
  type AlunoListItem,
  alunoListItemSchema,
  type AlunoPerfil,
  alunoPerfilSchema,
} from '@arbora/contracts';
import { z } from 'zod';

import { serverFetch } from './server-api';

export function listarAlunos(): Promise<AlunoListItem[]> {
  return serverFetch('alunos', { schema: z.array(alunoListItemSchema) });
}

export function buscarAlunoPerfil(id: string): Promise<AlunoPerfil> {
  return serverFetch(`alunos/${id}`, { schema: alunoPerfilSchema });
}
