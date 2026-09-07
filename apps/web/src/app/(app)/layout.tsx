import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';
import { getServerUser } from '@/lib/server-session';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();
  // Defesa em profundidade: o middleware já barra sem sessão, isso só evita
  // renderizar a casca com user nulo caso a sessão expire entre as duas checagens.
  if (!user) redirect('/login');

  return <AppShell user={user}>{children}</AppShell>;
}
