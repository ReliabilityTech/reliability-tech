'use client';

import { criarEventoRequestSchema, type EventoTipo } from '@arbora/contracts';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';

import { criarEvento } from '@/lib/eventos-client';
import { primeiroErroPorCampo } from '@/lib/form-errors';

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
  const [erros, setErros] = useState<Record<string, string>>({});

  function limparEAbrir(): void {
    setTitulo('');
    setTipo('EVENTO');
    setDataInicio('');
    setErros({});
    dialogRef.current?.showModal();
  }

  async function handleSubmit(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setErros({});

    if (!dataInicio) {
      setErros({ dataInicio: 'Informe uma data' });
      return;
    }

    const [ano, mes, dia] = dataInicio.split('-').map(Number);
    const payload = {
      titulo,
      tipo,
      // Meio-dia local em vez de meia-noite UTC: evita a data cair no dia
      // anterior ao renderizar em fusos horários atrás de UTC (ex.: -03:00).
      dataInicio: new Date(ano!, mes! - 1, dia!, 12, 0, 0).toISOString(),
    };
    const validado = criarEventoRequestSchema.safeParse(payload);
    if (!validado.success) {
      setErros(primeiroErroPorCampo(validado.error.issues));
      return;
    }

    setEnviando(true);
    try {
      await criarEvento(validado.data);
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setErros({ _root: 'Não foi possível cadastrar o evento. Tente novamente.' });
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
              aria-invalid={Boolean(erros.titulo)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.titulo ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              }`}
            />
            {erros.titulo && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.titulo}
              </p>
            )}
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
              aria-invalid={Boolean(erros.dataInicio)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.dataInicio ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              }`}
            />
            {erros.dataInicio && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.dataInicio}
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
              {enviando ? 'Salvando…' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
