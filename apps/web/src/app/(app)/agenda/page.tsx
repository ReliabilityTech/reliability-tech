import { type EventoTipo } from '@arbora/contracts';
import { Users } from 'lucide-react';

import { listarEventos } from '@/lib/eventos';
import { requireRole } from '@/lib/server-session';

import { NovoEventoDialog } from './novo-evento-dialog';

const CATEGORIA_LABEL: Record<EventoTipo, string> = {
  REUNIAO: 'Reunião Escolar',
  EVENTO: 'Evento Escolar',
  FERIADO: 'Feriado',
  PROVA: 'Prazo Final',
};

const CATEGORIA_COR: Record<EventoTipo, string> = {
  REUNIAO: 'bg-[var(--color-info)]',
  EVENTO: 'bg-[var(--color-brand-600)]',
  FERIADO: 'bg-[var(--color-danger)]',
  PROVA: 'bg-[var(--color-foreground-muted)]',
};

function formatarDetalhe(evento: { quando: string }): string {
  return new Date(evento.quando).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default async function AgendaPage() {
  const user = await requireRole(['ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR', 'RESPONSAVEL']);
  const eventos = await listarEventos();

  const hoje = new Date();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diasComEvento = new Set(
    eventos
      .map((evento) => new Date(evento.dataInicio))
      .filter(
        (data) => data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth(),
      )
      .map((data) => data.getDate()),
  );

  const proximosEventos = eventos
    .filter((evento) => new Date(evento.dataInicio) >= hoje)
    .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio))
    .slice(0, 5);

  const podeCriar = user.role === 'ADMIN_ESCOLAR' || user.role === 'COORDENACAO';

  return (
    <div className="p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda escolar</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--color-foreground-muted)]">
            {Object.entries(CATEGORIA_LABEL).map(([tipo, label]) => (
              <span key={tipo} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${CATEGORIA_COR[tipo as EventoTipo]}`} />
                {label}
              </span>
            ))}
          </div>
        </div>
        {podeCriar && <NovoEventoDialog />}
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:col-span-2">
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
              <span key={dia} className="py-1 font-medium text-[var(--color-foreground-muted)]">
                {dia}
              </span>
            ))}
            {Array.from({ length: diasNoMes }, (_, i) => i + 1).map((dia) => (
              <span
                key={dia}
                className={`rounded-(--radius-card) py-2 ${
                  diasComEvento.has(dia)
                    ? 'bg-[var(--color-brand-600)] font-semibold text-white'
                    : ''
                }`}
              >
                {dia}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 font-semibold">Próximos eventos</h2>
          {proximosEventos.length === 0 ? (
            <p className="text-sm text-[var(--color-foreground-muted)]">
              Nenhum evento futuro cadastrado.
            </p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {proximosEventos.map((evento) => (
                <li
                  key={evento.id}
                  className="rounded-(--radius-card) border border-[var(--color-border)] p-3"
                >
                  <span className="mb-1 inline-block rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-brand-600)]">
                    {CATEGORIA_LABEL[evento.tipo]}
                  </span>
                  <p className="font-medium">{evento.titulo}</p>
                  <p className="flex items-center gap-1.5 text-[var(--color-foreground-muted)]">
                    <Users className="h-3.5 w-3.5" aria-hidden />{' '}
                    {evento.turmaNome ?? 'Toda a instituição'}
                  </p>
                  <p className="text-[var(--color-foreground-muted)]">
                    {formatarDetalhe({ quando: evento.dataInicio })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
