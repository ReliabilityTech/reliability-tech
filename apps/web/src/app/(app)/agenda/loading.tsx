import { SkeletonHeader, SkeletonList } from '@/components/skeleton';

export default function CarregandoAgenda() {
  return (
    <div className="p-8">
      <SkeletonHeader comAcao />
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-(--radius-card) bg-[var(--color-border)]/30 h-72 animate-pulse border border-[var(--color-border)] lg:col-span-2" />
        <SkeletonList rows={3} />
      </section>
    </div>
  );
}
