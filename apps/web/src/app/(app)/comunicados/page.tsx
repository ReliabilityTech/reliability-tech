import { CheckCircle2, Plus, Send } from 'lucide-react';

import { StatCard } from '@/components/stat-card';
import { type BadgeTone, StatusBadge } from '@/components/status-badge';
import { requireRole } from '@/lib/server-session';

const COMUNICADOS = [
  {
    titulo: 'Reunião de Pais - 1º Bimestre',
    id: 'ANN-2026-001',
    destinatario: 'Pais (todos)',
    publicadoPor: 'Diretoria Acadêmica',
    data: '12 out. 2026',
    leitura: '85%',
    status: 'Publicado' as const,
  },
  {
    titulo: 'Aviso de Feriado Nacional',
    id: 'ANN-2026-004',
    destinatario: 'Toda a instituição',
    publicadoPor: 'RH Central',
    data: '15 out. 2026',
    leitura: '45%',
    status: 'Publicado' as const,
  },
  {
    titulo: 'Lista de Materiais Complementares',
    id: 'ANN-2026-007',
    destinatario: 'Professores (K-12)',
    publicadoPor: 'Coord. Maria Silva',
    data: '18 out. 2026',
    leitura: '100%',
    status: 'Arquivado' as const,
  },
] as const;

const STATUS_TONE: Record<(typeof COMUNICADOS)[number]['status'], BadgeTone> = {
  Publicado: 'success',
  Arquivado: 'neutral',
};

export default async function ComunicadosPage() {
  await requireRole(['ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR']);

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comunicados</h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Envie informações para responsáveis, turmas ou toda a instituição.
          </p>
        </div>
        <button
          type="button"
          className="rounded-(--radius-card) flex items-center gap-2 bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Novo comunicado
        </button>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard icon={Send} label="Publicados" value="142" />
        <StatCard icon={CheckCircle2} label="Aguardando ciência" value="28" />
      </section>

      <div className="rounded-(--radius-card) overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-foreground-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Destinatário</th>
              <th className="px-4 py-3 font-medium">Publicado por</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Leitura</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {COMUNICADOS.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{c.titulo}</p>
                  <p className="text-xs text-[var(--color-foreground-muted)]">ID {c.id}</p>
                </td>
                <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{c.destinatario}</td>
                <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{c.publicadoPor}</td>
                <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{c.data}</td>
                <td className="px-4 py-3">{c.leitura}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={STATUS_TONE[c.status]}>{c.status}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
