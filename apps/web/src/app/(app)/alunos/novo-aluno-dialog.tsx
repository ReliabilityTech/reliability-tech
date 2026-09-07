'use client';

import { criarAlunoRequestSchema, type TurmaListItem } from '@arbora/contracts';
import { UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';

import { criarAluno } from '@/lib/alunos-client';
import { primeiroErroPorCampo } from '@/lib/form-errors';

export function NovoAlunoDialog({ turmas }: { turmas: TurmaListItem[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [matricula, setMatricula] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  function limparEAbrir(): void {
    setNome('');
    setDataNascimento('');
    setMatricula('');
    setTurmaId('');
    setErros({});
    dialogRef.current?.showModal();
  }

  async function handleSubmit(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setErros({});

    const validado = criarAlunoRequestSchema.safeParse({
      nome,
      matricula,
      dataNascimento: dataNascimento ? new Date(dataNascimento).toISOString() : '',
      turmaId: turmaId || undefined,
    });
    if (!validado.success) {
      setErros(primeiroErroPorCampo(validado.error.issues));
      return;
    }

    setEnviando(true);
    try {
      await criarAluno(validado.data);
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setErros({ _root: 'Não foi possível cadastrar o aluno. Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={limparEAbrir}
        className="rounded-(--radius-card) flex items-center gap-2 bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white"
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        Cadastrar aluno
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-(--radius-card) w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0 backdrop:bg-black/40"
      >
        <form onSubmit={(evento) => void handleSubmit(evento)} className="flex flex-col gap-3 p-5">
          <h2 className="text-lg font-semibold">Cadastrar aluno</h2>

          <label className="text-sm font-medium">
            Nome
            <input
              required
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              aria-invalid={Boolean(erros.nome)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.nome ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              }`}
            />
            {erros.nome && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.nome}
              </p>
            )}
          </label>

          <label className="text-sm font-medium">
            Data de nascimento
            <input
              required
              type="date"
              value={dataNascimento}
              onChange={(evento) => setDataNascimento(evento.target.value)}
              aria-invalid={Boolean(erros.dataNascimento)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.dataNascimento
                  ? 'border-[var(--color-danger)]'
                  : 'border-[var(--color-border)]'
              }`}
            />
            {erros.dataNascimento && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.dataNascimento}
              </p>
            )}
          </label>

          <label className="text-sm font-medium">
            Matrícula
            <input
              required
              value={matricula}
              onChange={(evento) => setMatricula(evento.target.value)}
              aria-invalid={Boolean(erros.matricula)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.matricula ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              }`}
            />
            {erros.matricula && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.matricula}
              </p>
            )}
          </label>

          <label className="text-sm font-medium">
            Turma
            <select
              value={turmaId}
              onChange={(evento) => setTurmaId(evento.target.value)}
              className="rounded-(--radius-card) mt-1 w-full border border-[var(--color-border)] px-3 py-2 text-sm font-normal"
            >
              <option value="">Sem turma</option>
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome}
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
              {enviando ? 'Cadastrando…' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
