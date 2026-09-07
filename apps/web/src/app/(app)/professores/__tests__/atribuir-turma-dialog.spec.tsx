import { type DisciplinaListItem, type TurmaListItem } from '@arbora/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { atribuirTurmaDisciplina } from '@/lib/turma-disciplinas-client';

import { AtribuirTurmaDialog } from '../atribuir-turma-dialog';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/turma-disciplinas-client', () => ({
  atribuirTurmaDisciplina: vi.fn(),
}));

const turmas: TurmaListItem[] = [
  { id: 'turma-1', nome: '5º Ano A', serie: '5º Ano', anoLetivo: 2026 },
  { id: 'turma-2', nome: '6º Ano B', serie: '6º Ano', anoLetivo: 2026 },
];
const disciplinas: DisciplinaListItem[] = [
  { id: 'disciplina-1', nome: 'Matemática' },
  { id: 'disciplina-2', nome: 'Português' },
];

async function abrirDialogo(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup({ delay: null });
  render(<AtribuirTurmaDialog professorId="prof-1" turmas={turmas} disciplinas={disciplinas} />);
  await user.click(screen.getByRole('button', { name: 'Atribuir turma' }));
  return user;
}

describe('AtribuirTurmaDialog', () => {
  beforeEach(() => {
    vi.mocked(atribuirTurmaDisciplina).mockReset();
    refresh.mockReset();
  });

  it('fica desabilitado quando não há turma ou disciplina cadastrada', () => {
    render(<AtribuirTurmaDialog professorId="prof-1" turmas={[]} disciplinas={disciplinas} />);
    expect(screen.getByRole('button', { name: 'Atribuir turma' })).toBeDisabled();
  });

  it('atribui a primeira turma/disciplina por padrão', async () => {
    vi.mocked(atribuirTurmaDisciplina).mockResolvedValue({ id: 'td-1' });
    const user = await abrirDialogo();

    await user.click(screen.getByRole('button', { name: 'Atribuir' }));

    await vi.waitFor(() =>
      expect(atribuirTurmaDisciplina).toHaveBeenCalledWith({
        turmaId: 'turma-1',
        disciplinaId: 'disciplina-1',
        professorId: 'prof-1',
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('atribui a turma/disciplina selecionada', async () => {
    vi.mocked(atribuirTurmaDisciplina).mockResolvedValue({ id: 'td-2' });
    const user = await abrirDialogo();

    await user.selectOptions(screen.getByLabelText('Turma'), 'turma-2');
    await user.selectOptions(screen.getByLabelText('Disciplina'), 'disciplina-2');
    await user.click(screen.getByRole('button', { name: 'Atribuir' }));

    await vi.waitFor(() =>
      expect(atribuirTurmaDisciplina).toHaveBeenCalledWith({
        turmaId: 'turma-2',
        disciplinaId: 'disciplina-2',
        professorId: 'prof-1',
      }),
    );
  });

  it('mostra erro geral quando a API falha', async () => {
    vi.mocked(atribuirTurmaDisciplina).mockRejectedValue(new Error('falhou'));
    const user = await abrirDialogo();

    await user.click(screen.getByRole('button', { name: 'Atribuir' }));

    expect(
      await screen.findByText('Não foi possível atribuir a turma. Tente novamente.'),
    ).toBeInTheDocument();
  });
});
