import { AlertOctagon, Building2, Plus, Users } from 'lucide-react';

import { StatCard } from '@/components/stat-card';
import { type BadgeTone, StatusBadge } from '@/components/status-badge';
import { requireRole } from '@/lib/server-session';

const INSTITUICOES = [
  {
    nome: 'Colégio São José',
    local: 'São Paulo, SP',
    plano: 'Enterprise',
    alunos: '2.450',
    status: 'Ativo' as const,
    desde: '12 dez. 2023',
  },
  {
    nome: 'Escola Leonardo Da Vinci',
    local: 'Curitiba, PR',
    plano: 'Standard',
    alunos: '810',
    status: 'Inadimplente' as const,
    desde: '01 jan. 2024',
  },
  {
    nome: 'Instituto Maria Montessori',
    local: 'Fortaleza, CE',
    plano: 'Enterprise',
    alunos: '1.210',
    status: 'Suspenso' as const,
    desde: '22 ago. 2022',
  },
  {
    nome: 'Palladino High School',
    local: 'Campinas, SP',
    plano: 'Professional Plus',
    alunos: '3.800',
    status: 'Ativo' as const,
    desde: '15 out. 2023',
  },
] as const;

const STATUS_TONE: Record<(typeof INSTITUICOES)[number]['status'], BadgeTone> = {
  Ativo: 'success',
  Inadimplente: 'warning',
  Suspenso: 'danger',
};

export default async function SuperAdminPage() {
  await requireRole(['SUPER_ADMIN']);

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administração da plataforma</h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Visualize e gerencie todo o ecossistema da marca Arbora.
          </p>
        </div>
        <button
          type="button"
          className="rounded-(--radius-card) flex items-center gap-2 bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nova instituição
        </button>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Instituições ativas" value="1.248" hint="+64 este mês" />
        <StatCard icon={Building2} label="Em implantação" value="42" />
        <StatCard icon={AlertOctagon} label="Suspensas" value="14" hint="-2%" />
        <StatCard icon={Users} label="Total de alunos" value="842k" />
      </section>

      <div className="rounded-(--radius-card) overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-foreground-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Instituição</th>
              <th className="px-4 py-3 font-medium">Localização</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Alunos</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Desde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {INSTITUICOES.map((inst) => (
              <tr key={inst.nome}>
                <td className="px-4 py-3 font-medium">{inst.nome}</td>
                <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{inst.local}</td>
                <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{inst.plano}</td>
                <td className="px-4 py-3">{inst.alunos}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={STATUS_TONE[inst.status]}>{inst.status}</StatusBadge>
                </td>
                <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{inst.desde}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
        Mostrando {INSTITUICOES.length} de 1.248 instituições
      </p>
    </div>
  );
}
