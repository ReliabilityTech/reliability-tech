import { SkeletonHeader, SkeletonList } from '@/components/skeleton';

export default function CarregandoChamada() {
  return (
    <div className="p-8">
      <SkeletonHeader comAcao />
      <SkeletonList rows={5} />
    </div>
  );
}
