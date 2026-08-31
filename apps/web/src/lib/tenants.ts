import { type TenantListItem, tenantListItemSchema } from '@arbora/contracts';
import { z } from 'zod';

import { serverFetch } from './server-api';

export function listarTenants(): Promise<TenantListItem[]> {
  return serverFetch('tenants', { schema: z.array(tenantListItemSchema) });
}
