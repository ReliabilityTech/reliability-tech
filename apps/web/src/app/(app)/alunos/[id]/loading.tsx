import { SkeletonList, SkeletonStatCards } from '@/components/skeleton';

export default function CarregandoPerfilAluno() {
  return (
    <div className="p-8">
      <header className="mb-6 flex items-center gap-4">
        <div className="bg-[var(--color-border)]/60 h-16 w-16 animate-pulse rounded-full" />
        <div>
          <div className="rounded-(--radius-card) bg-[var(--color-border)]/60 mb-2 h-6 w-56 animate-pulse" />
          <div className="rounded-(--radius-card) bg-[var(--color-border)]/60 h-4 w-40 animate-pulse" />
        </div>
      </header>
      <SkeletonStatCards count={3} />
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SkeletonList rows={2} />
        </div>
        <SkeletonList rows={2} />
      </section>
    </div>
  );
}
