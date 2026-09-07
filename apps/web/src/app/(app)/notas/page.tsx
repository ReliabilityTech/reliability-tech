import { listarNotas, listarPeriodos, listarTurmasProfessor } from '@/lib/professor';
import { requireRole } from '@/lib/server-session';

import { FiltrosNotas } from './filtros-notas';
import { NotasForm } from './notas-form';

export default async function LancamentoNotasPage({
  searchParams,
}: {
  searchParams: Promise<{ turmaDisciplinaId?: string; periodoLetivoId?: string }>;
}) {
  await requireRole(['PROFESSOR']);
  const sp = await searchParams;
  const [turmas, periodos] = await Promise.all([listarTurmasProfessor(), listarPeriodos()]);

  if (turmas.length === 0) {
    return (
      <div className="p-8">
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Nenhuma turma vinculada a este professor ainda.
        </p>
      </div>
    );
  }
  if (periodos.length === 0) {
    return (
      <div className="p-8">
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Nenhum período letivo cadastrado ainda.
        </p>
      </div>
    );
  }

  const turmaDisciplinaId = turmas.some((t) => t.id === sp.turmaDisciplinaId)
    ? sp.turmaDisciplinaId!
    : turmas[0]!.id;
  const periodoLetivoId = periodos.some((p) => p.id === sp.periodoLetivoId)
    ? sp.periodoLetivoId!
    : periodos[0]!.id;

  const lancamentos = await listarNotas(turmaDisciplinaId, periodoLetivoId);
  const turmaAtual = turmas.find((t) => t.id === turmaDisciplinaId)!;

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lançamento de notas</h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            {turmaAtual.disciplinaNome} · {turmaAtual.turmaNome}
          </p>
        </div>
        <FiltrosNotas
          turmas={turmas}
          periodos={periodos}
          turmaDisciplinaId={turmaDisciplinaId}
          periodoLetivoId={periodoLetivoId}
        />
      </header>

      <NotasForm
        key={`${turmaDisciplinaId}-${periodoLetivoId}`}
        turmaDisciplinaId={turmaDisciplinaId}
        periodoLetivoId={periodoLetivoId}
        lancamentos={lancamentos}
      />
    </div>
  );
}
