'use client';

import { type EventoTipo } from '@arbora/contracts';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';

import { criarEvento } from '@/lib/eventos-client';

const TIPO_LABEL: Record<EventoTipo, string> = {
  EVENTO: 'Evento Escolar',
  PROVA: 'Prazo Final',
  REUNIAO: 'Reunião Escolar',
  FERIADO: 'Feriado',
};

export function NovoEventoDialog() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<EventoTipo>('EVENTO');
  const [dataInicio, setDataInicio] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function limparEAbrir(): void {
    setTitulo('');
    setTipo('EVENTO');
    setDataInicio('');
    setErro(null);
    dialogRef.current?.showModal();
  }

  async function handleSubmit(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const [ano, mes, dia] = dataInicio.split('-').map(Number);
      await criarEvento({
        titulo,
        tipo,
        // Meio-dia local em vez de meia-noite UTC: evita a data cair no dia
        // anterior ao renderizar em fusos horários atrás de UTC (ex.: -03:00).
        dataInicio: new Date(ano!, mes! - 1, dia!, 12, 0, 0).toISOString(),
      });
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setErro('Não foi possível cadastrar o evento. Tente novamente.');
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
        Novo evento
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-(--radius-card) w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0 backdrop:bg-black/40"
      >
        <form onSubmit={(evento) => void handleSubmit(evento)} className="flex flex-col gap-3 p-5">
          <h2 className="text-lg font-semibold">Novo evento</h2>

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
            Tipo
            <select
              value={tipo}
              onChange={(evento) => setTipo(evento.target.value as EventoTipo)}
              className="rounded-(--radius-card) mt-1 w-full border border-[var(--color-border)] px-3 py-2 text-sm font-normal"
            >
              {Object.entries(TIPO_LABEL).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Data
            <input
              required
              type="date"
              value={dataInicio}
              onChange={(evento) => setDataInicio(evento.target.value)}
              className="rounded-(--radius-card) mt-1 w-full border border-[var(--color-border)] px-3 py-2 text-sm font-normal"
            />
          </label>

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
              {enviando ? 'Salvando…' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
