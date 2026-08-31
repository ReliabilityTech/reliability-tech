import { listarPresencas, listarTurmasProfessor } from '@/lib/professor';
import { requireRole } from '@/lib/server-session';

import { ChamadaList } from './chamada-list';

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function ChamadaPage({
  searchParams,
}: {
  searchParams: Promise<{ turmaDisciplinaId?: string; data?: string }>;
}) {
  await requireRole(['PROFESSOR']);
  const sp = await searchParams;
  const turmas = await listarTurmasProfessor();

  if (turmas.length === 0) {
    return (
      <div className="p-8">
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Nenhuma turma vinculada a este professor ainda.
        </p>
      </div>
    );
  }

  const turmaDisciplinaId = turmas.some((t) => t.id === sp.turmaDisciplinaId)
    ? sp.turmaDisciplinaId!
    : turmas[0]!.id;
  const data = sp.data ?? hoje();

  const presencas = await listarPresencas(turmaDisciplinaId, data);

  return (
    <ChamadaList
      key={`${turmaDisciplinaId}-${data}`}
      turmas={turmas}
      turmaDisciplinaId={turmaDisciplinaId}
      data={data}
      presencas={presencas}
    />
  );
}
