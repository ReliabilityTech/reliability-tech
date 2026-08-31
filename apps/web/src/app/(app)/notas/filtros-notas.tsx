'use client';

import { type PeriodoLetivoResumo, type TurmaDisciplinaResumo } from '@arbora/contracts';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const TIPO_LABEL: Record<PeriodoLetivoResumo['tipo'], string> = {
  BIMESTRE: 'Bimestre',
  TRIMESTRE: 'Trimestre',
};

export function labelPeriodo(periodo: PeriodoLetivoResumo): string {
  return `${periodo.numero}º ${TIPO_LABEL[periodo.tipo]} ${periodo.anoLetivo}`;
}

export function FiltrosNotas({
  turmas,
  periodos,
  turmaDisciplinaId,
  periodoLetivoId,
}: {
  turmas: TurmaDisciplinaResumo[];
  periodos: PeriodoLetivoResumo[];
  turmaDisciplinaId: string;
  periodoLetivoId: string;
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
        className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
      >
        {turmas.map((turma) => (
          <option key={turma.id} value={turma.id}>
            {turma.disciplinaNome} · {turma.turmaNome}
          </option>
        ))}
      </select>
      <select
        value={periodoLetivoId}
        onChange={(evento) => atualizar('periodoLetivoId', evento.target.value)}
        className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
      >
        {periodos.map((periodo) => (
          <option key={periodo.id} value={periodo.id}>
            {labelPeriodo(periodo)}
          </option>
        ))}
      </select>
    </div>
  );
}
