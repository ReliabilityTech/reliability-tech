import { UserPlus } from 'lucide-react';
import Link from 'next/link';

import { type BadgeTone, StatusBadge } from '@/components/status-badge';
import { requireRole } from '@/lib/server-session';

const ALUNOS = [
  {
    id: '1',
    nome: 'Alice Machado',
    matricula: '2026-00152',
    turma: '1º Ano EM · Turma A (Manhã)',
    responsaveis: 'Beatriz M. (Mãe)',
    frequencia: '98%',
    status: 'Ativo' as const,
  },
  {
    id: '2',
    nome: 'Bruno Rocha',
    matricula: '2026-00084',
    turma: '2º Ano EM · Turma B (Tarde)',
    responsaveis: 'Carlos R. (Pai)',
    frequencia: '75%',
    status: 'Em risco' as const,
  },
  {
    id: '3',
    nome: 'Clara Mendes',
    matricula: '2026-00131',
    turma: '1º Ano EM · Turma A (Manhã)',
    responsaveis: 'Sonia M. (Mãe)',
    frequencia: '—',
    status: 'Transferido' as const,
  },
  {
    id: '4',
    nome: 'Daniel Silva',
    matricula: '2026-00012',
    turma: '3º Ano EM · Turma C',
    responsaveis: 'José S. (Pai)',
    frequencia: '96%',
    status: 'Ativo' as const,
  },
] as const;

const STATUS_TONE: Record<(typeof ALUNOS)[number]['status'], BadgeTone> = {
  Ativo: 'success',
  'Em risco': 'danger',
  Transferido: 'neutral',
};

export default async function AlunosPage() {
  await requireRole(['ADMIN_ESCOLAR', 'COORDENACAO']);

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
          className="rounded-(--radius-card) flex items-center gap-2 bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          Cadastrar aluno
        </button>
      </header>

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
            {ALUNOS.map((aluno) => (
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
                <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{aluno.turma}</td>
                <td className="px-4 py-3 text-[var(--color-foreground-muted)]">
                  {aluno.responsaveis}
                </td>
                <td className="px-4 py-3">{aluno.frequencia}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={STATUS_TONE[aluno.status]}>{aluno.status}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
        Mostrando {ALUNOS.length} de 485 alunos
      </p>
    </div>
  );
}
