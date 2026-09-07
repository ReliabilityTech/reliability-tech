import { captureException } from '@sentry/nextjs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiRequestError } from '@/lib/api-client';

import ErroApp from '../error';

// @sentry/nextjs de verdade puxa código de plugin de webpack que só faz
// sentido dentro do build do Next — fora dele (aqui, no Vitest) quebra com
// "The URL must be of scheme file". Mock evita carregar o pacote real.
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('ErroApp', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(captureException).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mostra a mensagem da ApiRequestError quando o erro veio da API', () => {
    const erro = new ApiRequestError({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Você não tem permissão para ver este aluno.',
      timestamp: new Date().toISOString(),
    });

    render(<ErroApp error={erro} reset={() => {}} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Você não tem permissão para ver este aluno.',
    );
  });

  it('mostra uma mensagem genérica para qualquer outro erro', () => {
    render(<ErroApp error={new Error('boom')} reset={() => {}} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar esta página. Tente novamente.',
    );
  });

  it('registra o erro no console ao montar', () => {
    const erro = new Error('boom');
    render(<ErroApp error={erro} reset={() => {}} />);

    expect(console.error).toHaveBeenCalledWith(erro);
  });

  it('manda pro Sentry um erro genérico (não é da API)', () => {
    const erro = new Error('boom');
    render(<ErroApp error={erro} reset={() => {}} />);

    expect(captureException).toHaveBeenCalledWith(erro);
  });

  it('manda pro Sentry um erro 5xx da API', () => {
    const erro = new ApiRequestError({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Erro interno no servidor',
      timestamp: new Date().toISOString(),
    });
    render(<ErroApp error={erro} reset={() => {}} />);

    expect(captureException).toHaveBeenCalledWith(erro);
  });

  it('não manda pro Sentry um erro 4xx da API — é esperado, não é falha', () => {
    const erro = new ApiRequestError({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Sem permissão',
      timestamp: new Date().toISOString(),
    });
    render(<ErroApp error={erro} reset={() => {}} />);

    expect(captureException).not.toHaveBeenCalled();
  });

  it('clicar em "Tentar novamente" chama reset', async () => {
    const user = userEvent.setup({ delay: null });
    const reset = vi.fn();
    render(<ErroApp error={new Error('boom')} reset={reset} />);

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(reset).toHaveBeenCalledOnce();
  });
});
