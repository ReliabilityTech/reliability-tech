'use client';

import { type TenantStatus } from '@arbora/contracts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { atualizarStatusTenant } from '@/lib/tenants-client';

export function ToggleStatusButton({
  tenantId,
  status,
}: {
  tenantId: string;
  status: TenantStatus;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const novoStatus: TenantStatus = status === 'ATIVO' ? 'SUSPENSO' : 'ATIVO';

  async function handleClick(): Promise<void> {
    setCarregando(true);
    try {
      await atualizarStatusTenant(tenantId, novoStatus);
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={carregando}
      className="rounded-(--radius-card) border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium disabled:opacity-50"
    >
      {carregando ? '…' : status === 'ATIVO' ? 'Suspender' : 'Ativar'}
    </button>
  );
}
