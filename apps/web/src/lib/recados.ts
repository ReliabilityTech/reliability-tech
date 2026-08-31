import { type RecadoListItem, recadoListItemSchema } from '@arbora/contracts';
import { z } from 'zod';

import { serverFetch } from './server-api';

export function listarRecados(): Promise<RecadoListItem[]> {
  return serverFetch('recados', { schema: z.array(recadoListItemSchema) });
}
