import { type DashboardProfessorResponse } from '@arbora/contracts';
import { Megaphone, NotebookPen, Users } from 'lucide-react';
import Link from 'next/link';

export function ProfessorDashboard({
  nome,
  data,
}: {
  nome: string;
  data: DashboardProfessorResponse;
}) {
  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Olá, {nome.split(' ')[0]}</h1>
        <p className="text-sm text-[var(--color-foreground-muted)]">Suas turmas e disciplinas.</p>
      </header>

      <section className="rounded-(--radius-card) mb-6 border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {data.turmasDisciplinas.length === 0 ? (
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Nenhuma turma vinculada ainda.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {data.turmasDisciplinas.map((td) => (
              <li key={td.id} className="flex items-center gap-4 py-3">
                <span className="rounded-full bg-[var(--color-brand-50)] p-2 text-[var(--color-brand-600)]">
                  <Users className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="font-medium">{td.disciplinaNome}</p>
                  <p className="text-sm text-[var(--color-foreground-muted)]">{td.turmaNome}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
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
