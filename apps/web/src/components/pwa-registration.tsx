'use client';

import type { UserRole } from '@arbora/contracts';
import { useEffect } from 'react';

/**
 * Service worker só serve pra papel RESPONSAVEL (roadmap 6.3) — os demais
 * continuam sem PWA. Registro é por origem/browser, não por sessão: se o
 * mesmo navegador logar depois como outro papel, o worker instalado
 * continua ativo, mas só cacheia asset estático (ver public/sw.js), sem
 * risco de servir dado de tenant errado.
 */
export function PwaRegistration({ role }: { role: UserRole }) {
  useEffect(() => {
    if (role !== 'RESPONSAVEL') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, [role]);

  return null;
}
