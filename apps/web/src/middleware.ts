import { type NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';

/**
 * Protege toda rota fora de `/login` e `/recuperar-senha`. Consulta `/auth/me`
 * na API a cada navegação — mais simples e correto do que decodificar o JWT
 * aqui, mas soma uma chamada de rede por página. Revisar se a latência
 * incomodar.
 *
 * Prefetch de `<Link>` (App Router) também passa pelo middleware — sem esse
 * `if`, cada link visível na barra lateral disparava sua própria chamada a
 * `/auth/me` só de aparecer na tela, sem o usuário navegar de verdade.
 * Descoberto rodando a suíte E2E: o volume de prefetch concorrente estourava
 * o rate limit da API (429) e produzia lentidão em cascata, indistinguível à
 * primeira vista de máquina sob carga. Pular aqui é seguro: quem realmente
 * garante o acesso é `getServerUser()`/`requireRole()` no próprio Server
 * Component (ver `(app)/layout.tsx`), que roda de qualquer forma quando a
 * navegação (não o prefetch) de fato acontece.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get('next-router-prefetch') === '1') {
    return NextResponse.next();
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/me`, {
    headers: { cookie: request.headers.get('cookie') ?? '' },
  });
  if (response.ok) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!login|recuperar-senha|_next/static|_next/image|favicon.ico).*)'],
};
