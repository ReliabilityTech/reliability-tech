import { requireRole } from '@/lib/server-session';
import { listarTurmas } from '@/lib/turmas';

import { NovaTurmaDialog } from './nova-turma-dialog';

export default async function TurmasPage() {
  await requireRole(['ADMIN_ESCOLAR', 'COORDENACAO']);
  const turmas = await listarTurmas();

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Turmas</h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Gerencie as turmas cadastradas na instituição.
          </p>
        </div>
        <NovaTurmaDialog />
      </header>

      {turmas.length === 0 ? (
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Nenhuma turma cadastrada ainda.
        </p>
      ) : (
        <>
          <div className="rounded-(--radius-card) overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-foreground-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Série</th>
                  <th className="px-4 py-3 font-medium">Ano letivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {turmas.map((turma) => (
                  <tr key={turma.id}>
                    <td className="px-4 py-3 font-medium">{turma.nome}</td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                      {turma.serie}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                      {turma.anoLetivo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
            Mostrando {turmas.length} de {turmas.length} turmas
          </p>
        </>
      )}
    </div>
  );
}
