import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { config, middleware } from '../middleware';

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

  describe('matcher', () => {
    // O Next compila o matcher como path-to-regexp; esse padrão só usa grupo
    // com lookahead, então vale como regex ancorada.
    const protegida = (caminho: string): boolean =>
      new RegExp(`^${config.matcher[0]}$`).test(caminho);

    it('protege as páginas do app', () => {
      expect(protegida('/dashboard')).toBe(true);
      expect(protegida('/alunos/123')).toBe(true);
    });

    it('não intercepta o proxy da API — o POST de login ainda não tem sessão', () => {
      expect(protegida('/api/v1/auth/login')).toBe(false);
      expect(protegida('/api/v1/alunos')).toBe(false);
    });

    it('não intercepta login, recuperar-senha e estáticos', () => {
      expect(protegida('/login')).toBe(false);
      expect(protegida('/recuperar-senha')).toBe(false);
      expect(protegida('/_next/static/chunk.js')).toBe(false);
    });
  });
});
