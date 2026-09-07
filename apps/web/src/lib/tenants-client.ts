import { type CriarTenantRequest, type TenantStatus } from '@arbora/contracts';
import { z } from 'zod';

import { apiFetch } from './api-client';

export function criarTenant(body: CriarTenantRequest): Promise<{ id: string }> {
  return apiFetch('tenants', { method: 'POST', schema: z.object({ id: z.string() }), body });
}

export function atualizarStatusTenant(id: string, status: TenantStatus): Promise<{ id: string }> {
  return apiFetch(`tenants/${id}/status`, {
    method: 'PATCH',
    schema: z.object({ id: z.string() }),
    body: { status },
  });
}
