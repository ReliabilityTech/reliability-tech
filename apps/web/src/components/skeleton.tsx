function Bloco({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-(--radius-card) bg-[var(--color-border)]/60 animate-pulse ${className}`}
    />
  );
}

export function SkeletonHeader({ comAcao = false }: { comAcao?: boolean }) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <Bloco className="mb-2 h-7 w-48" />
        <Bloco className="h-4 w-72" />
      </div>
      {comAcao && <Bloco className="h-10 w-40" />}
    </header>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, indice) => (
        <div
          key={indice}
          className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <Bloco className="mb-3 h-8 w-8 rounded-full" />
          <Bloco className="mb-2 h-3 w-20" />
          <Bloco className="h-6 w-14" />
        </div>
      ))}
    </section>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-(--radius-card) overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--color-border)]">
          <tr>
            {Array.from({ length: cols }, (_, indice) => (
              <th key={indice} className="px-4 py-3">
                <Bloco className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {Array.from({ length: rows }, (_, linha) => (
            <tr key={linha}>
              {Array.from({ length: cols }, (_, coluna) => (
                <td key={coluna} className="px-4 py-3">
                  <Bloco className="h-4 w-24" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, indice) => (
        <li
          key={indice}
          className="rounded-(--radius-card) border border-[var(--color-border)] p-3"
        >
          <Bloco className="mb-2 h-3 w-20" />
          <Bloco className="h-4 w-40" />
        </li>
      ))}
    </ul>
  );
}
