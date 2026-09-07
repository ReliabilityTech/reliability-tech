import { type TenantStatus } from '@arbora/contracts';
import { AlertOctagon, Building2, Users } from 'lucide-react';

import { StatCard } from '@/components/stat-card';
import { type BadgeTone, StatusBadge } from '@/components/status-badge';
import { buscarDashboardSuperAdmin } from '@/lib/dashboard';
import { requireRole } from '@/lib/server-session';
import { listarTenants } from '@/lib/tenants';

import { NovaInstituicaoDialog } from './nova-instituicao-dialog';
import { ToggleStatusButton } from './toggle-status-button';

const STATUS_LABEL: Record<TenantStatus, string> = { ATIVO: 'Ativo', SUSPENSO: 'Suspenso' };
const STATUS_TONE: Record<TenantStatus, BadgeTone> = { ATIVO: 'success', SUSPENSO: 'danger' };

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function SuperAdminPage() {
  await requireRole(['SUPER_ADMIN']);
  const [tenants, resumo] = await Promise.all([listarTenants(), buscarDashboardSuperAdmin()]);

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administração da plataforma</h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Visualize e gerencie todo o ecossistema da marca Arbora.
          </p>
        </div>
        <NovaInstituicaoDialog />
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Building2}
          label="Instituições ativas"
          value={String(resumo.instituicoesAtivas)}
        />
        <StatCard
          icon={AlertOctagon}
          label="Suspensas"
          value={String(resumo.instituicoesSuspensas)}
        />
        <StatCard icon={Users} label="Total de alunos" value={String(resumo.totalAlunos)} />
      </section>

      {tenants.length === 0 ? (
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Nenhuma instituição cadastrada ainda.
        </p>
      ) : (
        <>
          <div className="rounded-(--radius-card) overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-foreground-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Instituição</th>
                  <th className="px-4 py-3 font-medium">Plano</th>
                  <th className="px-4 py-3 font-medium">Alunos</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Desde</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="px-4 py-3 font-medium">{tenant.nome}</td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                      {tenant.plano}
                    </td>
                    <td className="px-4 py-3">{tenant.totalAlunos}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={STATUS_TONE[tenant.status]}>
                        {STATUS_LABEL[tenant.status]}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                      {formatarData(tenant.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ToggleStatusButton tenantId={tenant.id} status={tenant.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
            Mostrando {tenants.length} de {tenants.length} instituições
          </p>
        </>
      )}
    </div>
  );
}
