import { type AlunoStatus } from '@arbora/contracts';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';

import { type BadgeTone, StatusBadge } from '@/components/status-badge';
import { listarAlunos } from '@/lib/alunos';
import { requireRole } from '@/lib/server-session';

const STATUS_LABEL: Record<AlunoStatus, string> = { ATIVO: 'Ativo', INATIVO: 'Inativo' };
const STATUS_TONE: Record<AlunoStatus, BadgeTone> = { ATIVO: 'success', INATIVO: 'neutral' };

export default async function AlunosPage() {
  await requireRole(['ADMIN_ESCOLAR', 'COORDENACAO']);
  const alunos = await listarAlunos();

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alunos</h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Gerencie matrículas, dados acadêmicos e vínculos com responsáveis.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="rounded-(--radius-card) flex items-center gap-2 bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          Cadastrar aluno
        </button>
      </header>

      {alunos.length === 0 ? (
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Nenhum aluno cadastrado ainda.
        </p>
      ) : (
        <>
          <div className="rounded-(--radius-card) overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-foreground-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Aluno</th>
                  <th className="px-4 py-3 font-medium">Matrícula</th>
                  <th className="px-4 py-3 font-medium">Turma</th>
                  <th className="px-4 py-3 font-medium">Responsáveis</th>
                  <th className="px-4 py-3 font-medium">Frequência</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {alunos.map((aluno) => (
                  <tr key={aluno.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/alunos/${aluno.id}`}
                        className="font-medium text-[var(--color-brand-600)]"
                      >
                        {aluno.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                      {aluno.matricula}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                      {aluno.turmaNome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                      {aluno.responsaveis}
                    </td>
                    <td className="px-4 py-3">
                      {aluno.frequencia === null ? '—' : `${aluno.frequencia}%`}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={STATUS_TONE[aluno.status]}>
                        {STATUS_LABEL[aluno.status]}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
            Mostrando {alunos.length} de {alunos.length} alunos
          </p>
        </>
      )}
    </div>
  );
}
