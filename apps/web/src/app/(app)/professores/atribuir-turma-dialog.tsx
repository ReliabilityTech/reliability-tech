'use client';

import {
  criarTurmaDisciplinaRequestSchema,
  type DisciplinaListItem,
  type TurmaListItem,
} from '@arbora/contracts';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';

import { atribuirTurmaDisciplina } from '@/lib/turma-disciplinas-client';

export function AtribuirTurmaDialog({
  professorId,
  turmas,
  disciplinas,
}: {
  professorId: string;
  turmas: TurmaListItem[];
  disciplinas: DisciplinaListItem[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [turmaId, setTurmaId] = useState(turmas[0]?.id ?? '');
  const [disciplinaId, setDisciplinaId] = useState(disciplinas[0]?.id ?? '');
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const semOpcoes = turmas.length === 0 || disciplinas.length === 0;

  function limparEAbrir(): void {
    setTurmaId(turmas[0]?.id ?? '');
    setDisciplinaId(disciplinas[0]?.id ?? '');
    setErros({});
    dialogRef.current?.showModal();
  }

  async function handleSubmit(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setErros({});

    const validado = criarTurmaDisciplinaRequestSchema.safeParse({
      turmaId,
      disciplinaId,
      professorId,
    });
    if (!validado.success) {
      setErros({ _root: 'Selecione uma turma e uma disciplina' });
      return;
    }

    setEnviando(true);
    try {
      await atribuirTurmaDisciplina(validado.data);
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setErros({ _root: 'Não foi possível atribuir a turma. Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={limparEAbrir}
        disabled={semOpcoes}
        title={semOpcoes ? 'Cadastre uma turma e uma disciplina antes de atribuir' : undefined}
        className="rounded-(--radius-card) border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium disabled:opacity-50"
      >
        Atribuir turma
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-(--radius-card) w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0 backdrop:bg-black/40"
      >
        <form onSubmit={(evento) => void handleSubmit(evento)} className="flex flex-col gap-3 p-5">
          <h2 className="text-lg font-semibold">Atribuir turma e disciplina</h2>

          <label className="text-sm font-medium">
            Turma
            <select
              value={turmaId}
              onChange={(evento) => setTurmaId(evento.target.value)}
              className="rounded-(--radius-card) mt-1 w-full border border-[var(--color-border)] px-3 py-2 text-sm font-normal"
            >
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Disciplina
            <select
              value={disciplinaId}
              onChange={(evento) => setDisciplinaId(evento.target.value)}
              className="rounded-(--radius-card) mt-1 w-full border border-[var(--color-border)] px-3 py-2 text-sm font-normal"
            >
              {disciplinas.map((disciplina) => (
                <option key={disciplina.id} value={disciplina.id}>
                  {disciplina.nome}
                </option>
              ))}
            </select>
          </label>

          {erros._root && (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {erros._root}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-(--radius-card) border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-(--radius-card) bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {enviando ? 'Atribuindo…' : 'Atribuir'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
