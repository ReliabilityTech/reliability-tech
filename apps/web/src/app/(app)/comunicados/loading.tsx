import { SkeletonHeader, SkeletonStatCards, SkeletonTable } from '@/components/skeleton';

export default function CarregandoComunicados() {
  return (
    <div className="p-8">
      <SkeletonHeader comAcao />
      <SkeletonStatCards count={2} />
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
}
