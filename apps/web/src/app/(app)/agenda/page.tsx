import { MapPin, Users } from 'lucide-react';

import { requireRole } from '@/lib/server-session';

const CATEGORIAS = [
  { nome: 'Reunião Escolar', cor: 'bg-[var(--color-info)]' },
  { nome: 'Evento Escolar', cor: 'bg-[var(--color-brand-600)]' },
  { nome: 'Feriado', cor: 'bg-[var(--color-danger)]' },
  { nome: 'Extracurricular', cor: 'bg-[var(--color-warning)]' },
  { nome: 'Prazo Final', cor: 'bg-[var(--color-foreground-muted)]' },
] as const;

const PROXIMOS_EVENTOS = [
  {
    categoria: 'Reunião',
    titulo: 'Conselho de Classe',
    detalhe: 'Corpo Docente',
    local: 'Auditório Principal',
  },
  {
    categoria: 'Escolar',
    titulo: 'Feira de Ciências 2026',
    detalhe: 'Toda a Escola',
    local: 'Quadra Poliesportiva',
  },
] as const;

const DIAS_DO_MES = Array.from({ length: 30 }, (_, i) => i + 1);
const DIA_COM_EVENTO = 15;

export default async function AgendaPage() {
  await requireRole(['ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR', 'RESPONSAVEL']);

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Agenda escolar</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--color-foreground-muted)]">
          {CATEGORIAS.map((cat) => (
            <span key={cat.nome} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${cat.cor}`} />
              {cat.nome}
            </span>
          ))}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:col-span-2">
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
              <span key={dia} className="py-1 font-medium text-[var(--color-foreground-muted)]">
                {dia}
              </span>
            ))}
            {DIAS_DO_MES.map((dia) => (
              <span
                key={dia}
                className={`rounded-(--radius-card) py-2 ${
                  dia === DIA_COM_EVENTO
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
          <ul className="flex flex-col gap-3 text-sm">
            {PROXIMOS_EVENTOS.map((evento) => (
              <li
                key={evento.titulo}
                className="rounded-(--radius-card) border border-[var(--color-border)] p-3"
              >
                <span className="mb-1 inline-block rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-brand-600)]">
                  {evento.categoria}
                </span>
                <p className="font-medium">{evento.titulo}</p>
                <p className="flex items-center gap-1.5 text-[var(--color-foreground-muted)]">
                  <Users className="h-3.5 w-3.5" aria-hidden /> {evento.detalhe}
                </p>
                <p className="flex items-center gap-1.5 text-[var(--color-foreground-muted)]">
                  <MapPin className="h-3.5 w-3.5" aria-hidden /> {evento.local}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
