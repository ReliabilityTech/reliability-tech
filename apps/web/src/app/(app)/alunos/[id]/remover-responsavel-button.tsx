'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { desvincularResponsavel } from '@/lib/alunos-client';

export function RemoverResponsavelButton({
  alunoId,
  responsavelId,
}: {
  alunoId: string;
  responsavelId: string;
}) {
  const router = useRouter();
  const [removendo, setRemovendo] = useState(false);

  async function handleClick(): Promise<void> {
    setRemovendo(true);
    await desvincularResponsavel(alunoId, responsavelId).catch(() => undefined);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={removendo}
      className="text-xs font-medium text-[var(--color-danger)] disabled:opacity-50"
    >
      {removendo ? 'Removendo…' : 'Desvincular'}
    </button>
  );
}
