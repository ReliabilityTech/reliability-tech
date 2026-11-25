import { describe, expect, it } from 'vitest';

import { resolveServerApiBase } from '../api-base';

describe('resolveServerApiBase', () => {
  it('usa a URL pública como está quando ela já é absoluta (dev)', () => {
    expect(resolveServerApiBase('http://localhost:3333/api/v1', undefined)).toBe(
      'http://localhost:3333/api/v1',
    );
  });

  it('junta API_ORIGIN ao caminho relativo (proxy do Next)', () => {
    expect(resolveServerApiBase('/api/v1', 'https://api.exemplo.fly.dev')).toBe(
      'https://api.exemplo.fly.dev/api/v1',
    );
  });

  it('ignora barra final em API_ORIGIN', () => {
    expect(resolveServerApiBase('/api/v1', 'https://api.exemplo.fly.dev/')).toBe(
      'https://api.exemplo.fly.dev/api/v1',
    );
  });

  it('falha com mensagem clara se a base é relativa e falta API_ORIGIN', () => {
    expect(() => resolveServerApiBase('/api/v1', undefined)).toThrow(/API_ORIGIN/);
  });
});
