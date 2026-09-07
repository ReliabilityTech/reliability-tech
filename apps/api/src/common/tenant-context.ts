import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * `tenantId` fica `null` até o `TenantContextInterceptor` (que roda depois do
 * AuthGuard) preencher — e continua `null` pra requisições sem sessão. `bypass`
 * é o escape do super-admin (RF-008), mesma exceção que `tenant.util.ts` já
 * documenta na camada de aplicação, agora espelhada pro RLS do Postgres
 * (ver migração `20260907165617_rls_tenant_isolation`).
 */
export type TenantContext = { tenantId: string | null; bypass: boolean };

export const tenantContextStorage = new AsyncLocalStorage<TenantContext>();
