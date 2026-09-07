import { type TurmaListItem } from '@arbora/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { criarAluno } from '@/lib/alunos-client';

import { NovoAlunoDialog } from '../novo-aluno-dialog';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/alunos-client', () => ({
  criarAluno: vi.fn(),
}));

const turmas: TurmaListItem[] = [
  { id: 'turma-1', nome: '5º Ano A', serie: '5º Ano', anoLetivo: 2026 },
];

async function abrirDialogo(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup({ delay: null });
  render(<NovoAlunoDialog turmas={turmas} />);
  await user.click(screen.getByRole('button', { name: 'Cadastrar aluno' }));
  return user;
}

describe('NovoAlunoDialog', () => {
  beforeEach(() => {
    vi.mocked(criarAluno).mockReset();
    refresh.mockReset();
  });

  it('nome vazio é bloqueado no client antes de ir pra API', async () => {
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), ' ');
    await user.type(screen.getByLabelText('Data de nascimento'), '2016-05-10');
    await user.type(screen.getByLabelText('Matrícula'), '2026-0099');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(criarAluno).not.toHaveBeenCalled();
  });

  it('cadastra um aluno sem turma quando "Sem turma" é mantido', async () => {
    vi.mocked(criarAluno).mockResolvedValue({ id: 'aluno-1' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Nova Aluna');
    await user.type(screen.getByLabelText('Data de nascimento'), '2016-05-10');
    await user.type(screen.getByLabelText('Matrícula'), '2026-0099');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await vi.waitFor(() => expect(criarAluno).toHaveBeenCalledOnce());
    const payload = vi.mocked(criarAluno).mock.calls[0]![0];
    expect(payload.turmaId).toBeUndefined();
    expect(payload.nome).toBe('Nova Aluna');
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('cadastra um aluno associado à turma selecionada', async () => {
    vi.mocked(criarAluno).mockResolvedValue({ id: 'aluno-2' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Outro Aluno');
    await user.type(screen.getByLabelText('Data de nascimento'), '2016-05-10');
    await user.type(screen.getByLabelText('Matrícula'), '2026-0100');
    await user.selectOptions(screen.getByLabelText('Turma'), 'turma-1');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await vi.waitFor(() =>
      expect(criarAluno).toHaveBeenCalledWith(expect.objectContaining({ turmaId: 'turma-1' })),
    );
  });

  it('mostra erro geral quando a API falha', async () => {
    vi.mocked(criarAluno).mockRejectedValue(new Error('falhou'));
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Nova Aluna');
    await user.type(screen.getByLabelText('Data de nascimento'), '2016-05-10');
    await user.type(screen.getByLabelText('Matrícula'), '2026-0099');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(
      await screen.findByText('Não foi possível cadastrar o aluno. Tente novamente.'),
    ).toBeInTheDocument();
  });
});
