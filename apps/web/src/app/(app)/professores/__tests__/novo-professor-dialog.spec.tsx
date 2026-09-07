import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { criarProfessor } from '@/lib/usuarios-client';

import { NovoProfessorDialog } from '../novo-professor-dialog';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/usuarios-client', () => ({
  criarProfessor: vi.fn(),
}));

async function abrirDialogo(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup({ delay: null });
  render(<NovoProfessorDialog />);
  await user.click(screen.getByRole('button', { name: 'Novo professor' }));
  return user;
}

describe('NovoProfessorDialog', () => {
  beforeEach(() => {
    vi.mocked(criarProfessor).mockReset();
    refresh.mockReset();
  });

  it('senha curta é bloqueada no client antes de ir pra API', async () => {
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Professor Novo');
    await user.type(screen.getByLabelText('E-mail'), 'novo@escola.local');
    await user.type(screen.getByLabelText('Senha inicial'), 'curta1A');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A senha deve ter ao menos 12 caracteres',
    );
    expect(criarProfessor).not.toHaveBeenCalled();
  });

  it('cadastra um professor válido e atualiza a página', async () => {
    vi.mocked(criarProfessor).mockResolvedValue({ id: 'prof-1' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Professor Novo');
    await user.type(screen.getByLabelText('E-mail'), 'novo@escola.local');
    await user.type(screen.getByLabelText('Senha inicial'), 'SenhaForte123');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await vi.waitFor(() =>
      expect(criarProfessor).toHaveBeenCalledWith({
        name: 'Professor Novo',
        email: 'novo@escola.local',
        password: 'SenhaForte123',
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('mostra erro geral quando a API falha', async () => {
    vi.mocked(criarProfessor).mockRejectedValue(new Error('falhou'));
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Professor Novo');
    await user.type(screen.getByLabelText('E-mail'), 'novo@escola.local');
    await user.type(screen.getByLabelText('Senha inicial'), 'SenhaForte123');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(
      await screen.findByText('Não foi possível cadastrar o professor. Tente novamente.'),
    ).toBeInTheDocument();
  });
});
