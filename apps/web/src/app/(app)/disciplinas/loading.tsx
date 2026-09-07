import { SkeletonHeader, SkeletonTable } from '@/components/skeleton';

export default function CarregandoDisciplinas() {
  return (
    <div className="p-8">
      <SkeletonHeader comAcao />
      <SkeletonTable rows={6} cols={1} />
    </div>
  );
}
