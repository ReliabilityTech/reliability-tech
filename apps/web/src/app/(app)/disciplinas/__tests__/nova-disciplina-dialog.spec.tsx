import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { criarDisciplina } from '@/lib/disciplinas-client';

import { NovaDisciplinaDialog } from '../nova-disciplina-dialog';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/disciplinas-client', () => ({
  criarDisciplina: vi.fn(),
}));

async function abrirDialogo(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup({ delay: null });
  render(<NovaDisciplinaDialog />);
  await user.click(screen.getByRole('button', { name: 'Nova disciplina' }));
  return user;
}

describe('NovaDisciplinaDialog', () => {
  beforeEach(() => {
    vi.mocked(criarDisciplina).mockReset();
    refresh.mockReset();
  });

  it('nome vazio é bloqueado no client antes de ir pra API', async () => {
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), ' ');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(criarDisciplina).not.toHaveBeenCalled();
  });

  it('cadastra uma disciplina válida e atualiza a página', async () => {
    vi.mocked(criarDisciplina).mockResolvedValue({ id: 'disciplina-1' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Matemática');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await vi.waitFor(() => expect(criarDisciplina).toHaveBeenCalledWith({ nome: 'Matemática' }));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('mostra erro geral quando a API falha', async () => {
    vi.mocked(criarDisciplina).mockRejectedValue(new Error('falhou'));
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Matemática');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(
      await screen.findByText('Não foi possível cadastrar a disciplina. Tente novamente.'),
    ).toBeInTheDocument();
  });
});
