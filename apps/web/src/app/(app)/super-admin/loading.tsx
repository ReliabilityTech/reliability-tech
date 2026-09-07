import { SkeletonHeader, SkeletonStatCards, SkeletonTable } from '@/components/skeleton';

export default function CarregandoSuperAdmin() {
  return (
    <div className="p-8">
      <SkeletonHeader comAcao />
      <SkeletonStatCards count={3} />
      <SkeletonTable rows={5} cols={6} />
    </div>
  );
}
