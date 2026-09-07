'use client';

import { criarTurmaRequestSchema } from '@arbora/contracts';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';

import { primeiroErroPorCampo } from '@/lib/form-errors';
import { criarTurma } from '@/lib/turmas-client';

const ANO_ATUAL = new Date().getFullYear();

export function NovaTurmaDialog() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState('');
  const [serie, setSerie] = useState('');
  const [anoLetivo, setAnoLetivo] = useState(String(ANO_ATUAL));
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  function limparEAbrir(): void {
    setNome('');
    setSerie('');
    setAnoLetivo(String(ANO_ATUAL));
    setErros({});
    dialogRef.current?.showModal();
  }

  async function handleSubmit(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setErros({});

    const validado = criarTurmaRequestSchema.safeParse({
      nome,
      serie,
      anoLetivo: Number(anoLetivo),
    });
    if (!validado.success) {
      setErros(primeiroErroPorCampo(validado.error.issues));
      return;
    }

    setEnviando(true);
    try {
      await criarTurma(validado.data);
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setErros({ _root: 'Não foi possível cadastrar a turma. Tente novamente.' });
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
        <Plus className="h-4 w-4" aria-hidden />
        Nova turma
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-(--radius-card) w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0 backdrop:bg-black/40"
      >
        <form onSubmit={(evento) => void handleSubmit(evento)} className="flex flex-col gap-3 p-5">
          <h2 className="text-lg font-semibold">Nova turma</h2>

          <label className="text-sm font-medium">
            Nome
            <input
              required
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              placeholder="5º Ano A"
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
            Série
            <input
              required
              value={serie}
              onChange={(evento) => setSerie(evento.target.value)}
              placeholder="5º Ano"
              aria-invalid={Boolean(erros.serie)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.serie ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              }`}
            />
            {erros.serie && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.serie}
              </p>
            )}
          </label>

          <label className="text-sm font-medium">
            Ano letivo
            <input
              required
              type="number"
              value={anoLetivo}
              onChange={(evento) => setAnoLetivo(evento.target.value)}
              aria-invalid={Boolean(erros.anoLetivo)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.anoLetivo ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              }`}
            />
            {erros.anoLetivo && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.anoLetivo}
              </p>
            )}
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
