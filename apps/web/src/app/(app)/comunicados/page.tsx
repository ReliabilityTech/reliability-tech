import { CheckCircle2, Send } from 'lucide-react';

import { StatCard } from '@/components/stat-card';
import { listarTurmasProfessor } from '@/lib/professor';
import { listarRecados } from '@/lib/recados';
import { requireRole } from '@/lib/server-session';

import { NovoRecadoDialog } from './novo-recado-dialog';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function ComunicadosPage() {
  const user = await requireRole(['ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR']);
  const [recados, turmas] = await Promise.all([
    listarRecados(),
    user.role === 'PROFESSOR' ? listarTurmasProfessor() : Promise.resolve([]),
  ]);

  const comLeituraPendente = recados.filter(
    (recado) => recado.leituraPercentual !== null && recado.leituraPercentual < 100,
  ).length;

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comunicados</h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Envie informações para responsáveis, turmas ou toda a instituição.
          </p>
        </div>
        <NovoRecadoDialog turmas={turmas} />
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard icon={Send} label="Publicados" value={String(recados.length)} />
        <StatCard
          icon={CheckCircle2}
          label="Com leitura pendente"
          value={String(comLeituraPendente)}
        />
      </section>

      {recados.length === 0 ? (
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Nenhum comunicado publicado ainda.
        </p>
      ) : (
        <div className="rounded-(--radius-card) overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-foreground-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Destinatário</th>
                <th className="px-4 py-3 font-medium">Publicado por</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Leitura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {recados.map((recado) => (
                <tr key={recado.id}>
                  <td className="px-4 py-3 font-medium">{recado.titulo}</td>
                  <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                    {recado.destinatarioLabel}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                    {recado.autorNome}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                    {formatarData(recado.publicadoEm)}
                  </td>
                  <td className="px-4 py-3">
                    {recado.leituraPercentual === null ? '—' : `${recado.leituraPercentual}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
