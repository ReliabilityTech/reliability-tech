'use client';

import { type RecadoDestinatario, type TurmaDisciplinaResumo } from '@arbora/contracts';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';

import { criarRecado } from '@/lib/recados-client';

export function NovoRecadoDialog({ turmas }: { turmas: TurmaDisciplinaResumo[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [destinatario, setDestinatario] = useState<RecadoDestinatario>('TODA_INSTITUICAO');
  const [turmaDisciplinaId, setTurmaDisciplinaId] = useState(turmas[0]?.id ?? '');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function limparEAbrir(): void {
    setTitulo('');
    setCorpo('');
    setDestinatario('TODA_INSTITUICAO');
    setErro(null);
    dialogRef.current?.showModal();
  }

  async function handleSubmit(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const turmaSelecionada = turmas.find((turma) => turma.id === turmaDisciplinaId);
      await criarRecado({
        titulo,
        corpo,
        destinatario,
        turmaId: destinatario === 'TURMA' ? turmaSelecionada?.turmaId : undefined,
      });
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setErro('Não foi possível publicar o comunicado. Tente novamente.');
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
        Novo comunicado
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-(--radius-card) w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0 backdrop:bg-black/40"
      >
        <form onSubmit={(evento) => void handleSubmit(evento)} className="flex flex-col gap-3 p-5">
          <h2 className="text-lg font-semibold">Novo comunicado</h2>

          <label className="text-sm font-medium">
            Título
            <input
              required
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
              className="rounded-(--radius-card) mt-1 w-full border border-[var(--color-border)] px-3 py-2 text-sm font-normal"
            />
          </label>

          <label className="text-sm font-medium">
            Mensagem
            <textarea
              required
              rows={4}
              value={corpo}
              onChange={(evento) => setCorpo(evento.target.value)}
              className="rounded-(--radius-card) mt-1 w-full border border-[var(--color-border)] px-3 py-2 text-sm font-normal"
            />
          </label>

          <label className="text-sm font-medium">
            Destinatário
            <select
              value={destinatario}
              onChange={(evento) => setDestinatario(evento.target.value as RecadoDestinatario)}
              className="rounded-(--radius-card) mt-1 w-full border border-[var(--color-border)] px-3 py-2 text-sm font-normal"
            >
              <option value="TODA_INSTITUICAO">Toda a instituição</option>
              {turmas.length > 0 && <option value="TURMA">Uma turma</option>}
            </select>
          </label>

          {destinatario === 'TURMA' && (
            <label className="text-sm font-medium">
              Turma
              <select
                value={turmaDisciplinaId}
                onChange={(evento) => setTurmaDisciplinaId(evento.target.value)}
                className="rounded-(--radius-card) mt-1 w-full border border-[var(--color-border)] px-3 py-2 text-sm font-normal"
              >
                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.disciplinaNome} · {turma.turmaNome}
                  </option>
                ))}
              </select>
            </label>
          )}

          {erro && <p className="text-sm text-[var(--color-danger)]">{erro}</p>}

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
              {enviando ? 'Publicando…' : 'Publicar'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
