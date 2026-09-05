import './globals.css';

import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import type { ReactNode } from 'react';

import { env } from '@/lib/env';

/** Manrope é a tipografia do Arbora Design System (ver docs/design-system.md). */
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: env.NEXT_PUBLIC_APP_NAME,
    template: `%s · ${env.NEXT_PUBLIC_APP_NAME}`,
  },
  description: 'Plataforma Arbora — Reliability Tech',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

/**
 * Roda antes da primeira pintura pra aplicar o tema salvo (ThemeToggle) sem
 * piscar o tema padrão por uma fração de segundo — mesma técnica de
 * bibliotecas como next-themes, sem trazer a dependência pra isso só.
 */
const SCRIPT_TEMA = `
  try {
    var t = localStorage.getItem('arbora-theme');
    if (t === 'light' || t === 'dark' || t === 'high-contrast') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
