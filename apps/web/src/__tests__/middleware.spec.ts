import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { middleware } from '../middleware';

describe('middleware', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('não chama a API pra requisição de prefetch — só passa adiante', async () => {
    const fetchEspiao = vi.fn();
    vi.stubGlobal('fetch', fetchEspiao);

    const request = new NextRequest('http://localhost:3000/dashboard', {
      headers: { 'next-router-prefetch': '1' },
    });
    const resposta = await middleware(request);

    expect(fetchEspiao).not.toHaveBeenCalled();
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('location')).toBeNull();
  });

  it('deixa passar quando /auth/me responde ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));

    const request = new NextRequest('http://localhost:3000/dashboard', {
      headers: { cookie: 'arbora_access=valido' },
    });
    const resposta = await middleware(request);

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('location')).toBeNull();
  });

  it('redireciona pro login com ?from quando /auth/me não responde ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    const request = new NextRequest('http://localhost:3000/alunos');
    const resposta = await middleware(request);

    expect(resposta.status).toBe(307);
    const local = new URL(resposta.headers.get('location') ?? '');
    expect(local.pathname).toBe('/login');
    expect(local.searchParams.get('from')).toBe('/alunos');
  });
});
