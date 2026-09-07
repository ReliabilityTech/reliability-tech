import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { criarTurma } from '@/lib/turmas-client';

import { NovaTurmaDialog } from '../nova-turma-dialog';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/turmas-client', () => ({
  criarTurma: vi.fn(),
}));

async function abrirDialogo(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup({ delay: null });
  render(<NovaTurmaDialog />);
  await user.click(screen.getByRole('button', { name: 'Nova turma' }));
  return user;
}

describe('NovaTurmaDialog', () => {
  beforeEach(() => {
    vi.mocked(criarTurma).mockReset();
    refresh.mockReset();
  });

  it('vem com o ano letivo atual preenchido', async () => {
    await abrirDialogo();
    expect(screen.getByLabelText('Ano letivo')).toHaveValue(new Date().getFullYear());
  });

  it('nome vazio é bloqueado no client antes de ir pra API', async () => {
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), ' ');
    await user.type(screen.getByLabelText('Série'), '5º Ano');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(criarTurma).not.toHaveBeenCalled();
  });

  it('cadastra uma turma válida e atualiza a página', async () => {
    vi.mocked(criarTurma).mockResolvedValue({ id: 'turma-1' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), '5º Ano A');
    await user.type(screen.getByLabelText('Série'), '5º Ano');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await vi.waitFor(() =>
      expect(criarTurma).toHaveBeenCalledWith({
        nome: '5º Ano A',
        serie: '5º Ano',
        anoLetivo: new Date().getFullYear(),
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('mostra erro geral quando a API falha', async () => {
    vi.mocked(criarTurma).mockRejectedValue(new Error('falhou'));
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), '5º Ano A');
    await user.type(screen.getByLabelText('Série'), '5º Ano');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(
      await screen.findByText('Não foi possível cadastrar a turma. Tente novamente.'),
    ).toBeInTheDocument();
  });
});
