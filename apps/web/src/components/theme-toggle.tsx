'use client';

import { useEffect, useState } from 'react';

type Preferencia = 'system' | 'light' | 'dark' | 'high-contrast';

const CHAVE_ARMAZENAMENTO = 'arbora-theme';

const LABEL: Record<Preferencia, string> = {
  system: 'Automático',
  light: 'Claro',
  dark: 'Escuro',
  'high-contrast': 'Alto contraste',
};

/**
 * Preferência persiste em localStorage e vira o atributo `data-theme` em
 * `<html>` — o mesmo mecanismo que o script inline em layout.tsx lê antes da
 * primeira pintura, pra não piscar o tema errado (ver RootLayout).
 */
export function ThemeToggle() {
  const [preferencia, setPreferencia] = useState<Preferencia>('system');

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (salvo === 'light' || salvo === 'dark' || salvo === 'high-contrast') {
      setPreferencia(salvo);
    }
  }, []);

  function aplicar(valor: Preferencia): void {
    setPreferencia(valor);
    if (valor === 'system') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem(CHAVE_ARMAZENAMENTO);
    } else {
      document.documentElement.setAttribute('data-theme', valor);
      localStorage.setItem(CHAVE_ARMAZENAMENTO, valor);
    }
  }

  return (
    <label className="flex items-center justify-between gap-2 text-xs text-[var(--color-brand-100)]">
      Tema
      <select
        value={preferencia}
        onChange={(evento) => aplicar(evento.target.value as Preferencia)}
        className="rounded-(--radius-card) border border-[var(--color-brand-700)] bg-[var(--color-brand-700)] px-2 py-1 text-xs text-white"
      >
        {(Object.keys(LABEL) as Preferencia[]).map((chave) => (
          <option key={chave} value={chave}>
            {LABEL[chave]}
          </option>
        ))}
      </select>
    </label>
  );
}
