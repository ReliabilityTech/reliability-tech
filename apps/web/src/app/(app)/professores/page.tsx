import { listarDisciplinas } from '@/lib/disciplinas';
import { requireRole } from '@/lib/server-session';
import { listarTurmas } from '@/lib/turmas';
import { listarProfessores } from '@/lib/usuarios';

import { AtribuirTurmaDialog } from './atribuir-turma-dialog';
import { NovoProfessorDialog } from './novo-professor-dialog';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function ProfessoresPage() {
  await requireRole(['ADMIN_ESCOLAR', 'COORDENACAO']);
  const [professores, turmas, disciplinas] = await Promise.all([
    listarProfessores(),
    listarTurmas(),
    listarDisciplinas(),
  ]);

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Professores</h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Gerencie as contas de professores da instituição.
          </p>
        </div>
        <NovoProfessorDialog />
      </header>

      {professores.length === 0 ? (
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Nenhum professor cadastrado ainda.
        </p>
      ) : (
        <>
          <div className="rounded-(--radius-card) overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-foreground-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Desde</th>
                  <th className="px-4 py-3 font-medium">Turmas atribuídas</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {professores.map((professor) => (
                  <tr key={professor.id}>
                    <td className="px-4 py-3 font-medium">{professor.name}</td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                      {professor.email}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                      {formatarData(professor.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                      {professor.turmasAtribuidas.length > 0
                        ? professor.turmasAtribuidas.join(', ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <AtribuirTurmaDialog
                        professorId={professor.id}
                        turmas={turmas}
                        disciplinas={disciplinas}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
            Mostrando {professores.length} de {professores.length} professores
          </p>
        </>
      )}
    </div>
  );
}
