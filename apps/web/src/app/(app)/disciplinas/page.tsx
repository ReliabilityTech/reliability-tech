import { listarDisciplinas } from '@/lib/disciplinas';
import { requireRole } from '@/lib/server-session';

import { NovaDisciplinaDialog } from './nova-disciplina-dialog';

export default async function DisciplinasPage() {
  await requireRole(['ADMIN_ESCOLAR', 'COORDENACAO']);
  const disciplinas = await listarDisciplinas();

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Disciplinas</h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Gerencie as disciplinas cadastradas na instituição.
          </p>
        </div>
        <NovaDisciplinaDialog />
      </header>

      {disciplinas.length === 0 ? (
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Nenhuma disciplina cadastrada ainda.
        </p>
      ) : (
        <>
          <div className="rounded-(--radius-card) overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-foreground-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {disciplinas.map((disciplina) => (
                  <tr key={disciplina.id}>
                    <td className="px-4 py-3 font-medium">{disciplina.nome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
            Mostrando {disciplinas.length} de {disciplinas.length} disciplinas
          </p>
        </>
      )}
    </div>
  );
}
