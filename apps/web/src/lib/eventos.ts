import { type EventoCalendario, eventoCalendarioSchema } from '@arbora/contracts';
import { z } from 'zod';

import { serverFetch } from './server-api';

export function listarEventos(): Promise<EventoCalendario[]> {
  return serverFetch('eventos', { schema: z.array(eventoCalendarioSchema) });
}
