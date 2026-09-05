import { SkeletonHeader, SkeletonTable } from '@/components/skeleton';

export default function CarregandoNotas() {
  return (
    <div className="p-8">
      <SkeletonHeader comAcao />
      <SkeletonTable rows={5} cols={3} />
    </div>
  );
}
