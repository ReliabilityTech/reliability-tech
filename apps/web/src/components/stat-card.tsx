import type { LucideIcon } from 'lucide-react';

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-[var(--color-brand-50)] p-2 text-[var(--color-brand-600)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {hint && <span className="text-xs text-[var(--color-foreground-muted)]">{hint}</span>}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-foreground-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </article>
  );
}
