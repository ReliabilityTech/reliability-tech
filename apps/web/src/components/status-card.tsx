import type { ReactNode } from 'react';

export type StatusTone = 'ok' | 'pendente';

const TONE_CLASSES: Record<StatusTone, string> = {
  ok: 'text-[var(--color-success)] border-[var(--color-success)]',
  pendente: 'text-[var(--color-warning)] border-[var(--color-warning)]',
};

export function StatusCard({
  title,
  tone,
  children,
}: {
  title: string;
  tone: StatusTone;
  children: ReactNode;
}) {
  return (
    <article className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
      <header className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
        >
          {tone === 'ok' ? 'pronto' : 'pendente'}
        </span>
      </header>
      <div className="text-sm text-[var(--color-foreground-muted)]">{children}</div>
    </article>
  );
}
