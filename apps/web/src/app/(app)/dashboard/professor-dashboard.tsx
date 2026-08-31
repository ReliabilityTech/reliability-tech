import { Megaphone, NotebookPen, Users } from 'lucide-react';
import Link from 'next/link';

const AULAS_HOJE: { horario: string; disciplina: string; turma: string; atual?: boolean }[] = [
  { horario: '08:00', disciplina: 'Matemática', turma: '5º Ano A · Sala 12' },
  { horario: '09:00', disciplina: 'Matemática', turma: '5º Ano B · Sala 8', atual: true },
  { horario: '10:30', disciplina: 'Matemática', turma: '5º Ano C · Sala 8' },
];

export function ProfessorDashboard({ nome }: { nome: string }) {
  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Olá, {nome.split(' ')[0]}</h1>
        <p className="text-sm text-[var(--color-foreground-muted)]">Suas atividades de hoje.</p>
      </header>

      <section className="rounded-(--radius-card) mb-6 border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <ul className="flex flex-col divide-y divide-[var(--color-border)]">
          {AULAS_HOJE.map((aula) => (
            <li
              key={aula.horario}
              className={`flex items-center gap-4 py-3 ${aula.atual ? 'border-l-4 border-[var(--color-brand-600)] pl-3' : ''}`}
            >
              <span className="w-14 text-sm font-medium text-[var(--color-foreground-muted)]">
                {aula.horario}
              </span>
              <div>
                <p className="font-medium">{aula.disciplina}</p>
                <p className="text-sm text-[var(--color-foreground-muted)]">{aula.turma}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/notas"
          className="rounded-(--radius-card) flex flex-col items-start gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-brand-600)]"
        >
          <span className="rounded-full bg-[var(--color-brand-50)] p-2 text-[var(--color-brand-600)]">
            <NotebookPen className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-medium">Lançar notas</span>
        </Link>
        <Link
          href="/comunicados"
          className="rounded-(--radius-card) flex flex-col items-start gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-brand-600)]"
        >
          <span className="rounded-full bg-[var(--color-brand-50)] p-2 text-[var(--color-brand-600)]">
            <Megaphone className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-medium">Criar comunicado</span>
        </Link>
        <Link
          href="/chamada"
          className="rounded-(--radius-card) flex flex-col items-start gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-brand-600)]"
        >
          <span className="rounded-full bg-[var(--color-brand-50)] p-2 text-[var(--color-brand-600)]">
            <Users className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-medium">Ver minhas turmas</span>
        </Link>
      </section>
    </div>
  );
}
