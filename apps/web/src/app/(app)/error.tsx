'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

import { ApiRequestError } from '@/lib/api-client';

/**
 * Cobre qualquer página em apps/web/src/app/(app)/**: erro de rede ou da API
 * derruba só o conteúdo, a casca (sidebar) continua de pé (error.tsx não
 * substitui o layout.tsx irmão, só o slot de children).
 */
export default function ErroApp({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const mensagem =
    error instanceof ApiRequestError
      ? error.message
      : 'Não foi possível carregar esta página. Tente novamente.';

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="bg-[var(--color-danger)]/15 rounded-full p-3 text-[var(--color-danger)]">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <p role="alert" className="max-w-sm text-sm text-[var(--color-foreground-muted)]">
        {mensagem}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-(--radius-card) bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white"
      >
        Tentar novamente
      </button>
    </div>
  );
}
