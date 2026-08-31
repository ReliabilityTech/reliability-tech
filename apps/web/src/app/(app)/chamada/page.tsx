import { requireRole } from '@/lib/server-session';

import { ChamadaList } from './chamada-list';

export default async function ChamadaPage() {
  await requireRole(['PROFESSOR']);
  return <ChamadaList />;
}
