'use client';

import { type TurmaDisciplinaResumo } from '@arbora/contracts';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function FiltrosChamada({
  turmas,
  turmaDisciplinaId,
  data,
}: {
  turmas: TurmaDisciplinaResumo[];
  turmaDisciplinaId: string;
  data: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function atualizar(chave: string, valor: string): void {
    const params = new URLSearchParams(searchParams.toString());
    params.set(chave, valor);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2">
      <select
        value={turmaDisciplinaId}
        onChange={(evento) => atualizar('turmaDisciplinaId', evento.target.value)}
        aria-label="Turma"
        className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
      >
        {turmas.map((turma) => (
          <option key={turma.id} value={turma.id}>
            {turma.disciplinaNome} · {turma.turmaNome}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={data}
        onChange={(evento) => atualizar('data', evento.target.value)}
        aria-label="Data da chamada"
        className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
      />
    </div>
  );
}
