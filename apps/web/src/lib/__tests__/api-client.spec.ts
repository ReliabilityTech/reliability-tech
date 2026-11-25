import { ERROR_CODES } from '@arbora/contracts';
import { describe, expect, it } from 'vitest';

import { buildUrl, toApiError } from '../api-client';

const BASE = 'http://localhost:3333/api/v1';

describe('buildUrl', () => {
  it('junta base e caminho sem duplicar barras', () => {
    expect(buildUrl('/health', undefined, `${BASE}/`)).toBe(`${BASE}/health`);
    expect(buildUrl('health', undefined, BASE)).toBe(`${BASE}/health`);
  });

  it('serializa os parâmetros de query', () => {
    expect(buildUrl('users', { page: 2, active: true }, BASE)).toBe(
      `${BASE}/users?page=2&active=true`,
    );
  });

  it('descarta parâmetros indefinidos, nulos ou vazios', () => {
    expect(buildUrl('users', { q: undefined, tag: null, nome: '' }, BASE)).toBe(`${BASE}/users`);
  });

  it('escapa caracteres especiais nos parâmetros', () => {
    expect(buildUrl('users', { q: 'a b&c' }, BASE)).toBe(`${BASE}/users?q=a+b%26c`);
  });
});

describe('buildUrl com base relativa (proxy do Next)', () => {
  it('mantém o caminho relativo, sem exigir origem', () => {
    expect(buildUrl('/auth/me', undefined, '/api/v1')).toBe('/api/v1/auth/me');
    expect(buildUrl('auth/me', undefined, '/api/v1/')).toBe('/api/v1/auth/me');
  });

  it('serializa a query em base relativa', () => {
    expect(buildUrl('users', { q: 'a b&c', page: 2, vazio: '' }, '/api/v1')).toBe(
      '/api/v1/users?q=a+b%26c&page=2',
    );
  });
});

describe('toApiError', () => {
  it('preserva um envelope de erro válido vindo da API', () => {
    const envelope = {
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND,
      message: 'Registro não encontrado',
      timestamp: '2026-01-01T00:00:00.000Z',
    };

    expect(toApiError(404, envelope)).toEqual(envelope);
  });

  it('gera um envelope sintético quando o corpo não segue o contrato', () => {
    const erro = toApiError(502, '<html>Bad Gateway</html>');

    expect(erro.statusCode).toBe(502);
    expect(erro.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(erro.message).toMatch(/Tente novamente/);
  });

  it('gera um envelope sintético quando o corpo é nulo', () => {
    expect(toApiError(500, null).code).toBe(ERROR_CODES.INTERNAL_ERROR);
  });
});
