import {
  SkeletonHeader,
  SkeletonList,
  SkeletonStatCards,
  SkeletonTable,
} from '@/components/skeleton';

export default function CarregandoDashboard() {
  return (
    <div className="p-8">
      <SkeletonHeader />
      <SkeletonStatCards />
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SkeletonTable rows={4} cols={4} />
        </div>
        <SkeletonList rows={4} />
      </section>
    </div>
  );
}
