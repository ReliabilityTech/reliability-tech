import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';
import { PwaRegistration } from '@/components/pwa-registration';
import { getServerUser } from '@/lib/server-session';

/**
 * Manifest só entra pro papel RESPONSAVEL (roadmap 6.3) — os demais não
 * recebem prompt de instalação nem o `<link rel="manifest">`.
 */
export async function generateMetadata(): Promise<Metadata> {
  const user = await getServerUser();
  if (user?.role !== 'RESPONSAVEL') return {};
  return { manifest: '/manifest.json' };
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();
  // Defesa em profundidade: o middleware já barra sem sessão, isso só evita
  // renderizar a casca com user nulo caso a sessão expire entre as duas checagens.
  if (!user) redirect('/login');

  return (
    <AppShell user={user}>
      <PwaRegistration role={user.role} />
      {children}
    </AppShell>
  );
}
