import { type NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';

/**
 * Protege toda rota fora de `/login` e `/recuperar-senha`. Consulta `/auth/me`
 * na API a cada navegação — mais simples e correto do que decodificar o JWT
 * aqui, mas soma uma chamada de rede por página. Revisar se a latência
 * incomodar.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
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
