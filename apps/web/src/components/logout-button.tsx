'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { logout } from '@/lib/auth';

export function LogoutButton() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function handleClick(): Promise<void> {
    setSaindo(true);
    await logout().catch(() => undefined);
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saindo}
      className="rounded-(--radius-card) border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium disabled:opacity-50"
    >
      {saindo ? 'Saindo…' : 'Sair'}
    </button>
  );
}
