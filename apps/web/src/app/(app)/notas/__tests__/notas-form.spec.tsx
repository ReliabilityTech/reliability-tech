import { type NotaLancamentoItem } from '@arbora/contracts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { lancarNota } from '@/lib/professor-client';

import { NotasForm } from '../notas-form';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/professor-client', () => ({
  lancarNota: vi.fn(),
}));

const lancamentos: NotaLancamentoItem[] = [
  { alunoId: 'aluno-ana', alunoNome: 'Ana Costa', valor: null, situacao: 'SEM_NOTA' },
  { alunoId: 'aluno-bruno', alunoNome: 'Bruno Lima', valor: 7, situacao: 'APROVADO' },
];

function linhaDe(nome: string): HTMLElement {
  return screen.getByText(nome).closest('tr')!;
}

describe('NotasForm', () => {
  beforeEach(() => {
    vi.mocked(lancarNota).mockReset();
    refresh.mockReset();
  });

  it('mostra "nenhum aluno" quando a turma está vazia', () => {
    render(<NotasForm turmaDisciplinaId="td-1" periodoLetivoId="periodo-1" lancamentos={[]} />);
    expect(screen.getByText('Nenhum aluno matriculado nesta turma.')).toBeInTheDocument();
  });

  it('pré-preenche o input com a nota já lançada e mostra a situação', () => {
    render(
      <NotasForm turmaDisciplinaId="td-1" periodoLetivoId="periodo-1" lancamentos={lancamentos} />,
    );

    expect(within(linhaDe('Bruno Lima')).getByRole('textbox')).toHaveValue('7');
    expect(within(linhaDe('Bruno Lima')).getByText('Aprovado')).toBeInTheDocument();
    expect(within(linhaDe('Ana Costa')).getByText('Sem nota')).toBeInTheDocument();
  });

  it('atualiza a situação ao vivo conforme a nota digitada', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <NotasForm turmaDisciplinaId="td-1" periodoLetivoId="periodo-1" lancamentos={lancamentos} />,
    );

    const input = within(linhaDe('Ana Costa')).getByRole('textbox');
    await user.type(input, '5');
    expect(within(linhaDe('Ana Costa')).getByText('Atenção')).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, '9');
    expect(within(linhaDe('Ana Costa')).getByText('Aprovado')).toBeInTheDocument();
  });

  it('nota fora de 0-10 é bloqueada antes de chamar a API', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <NotasForm turmaDisciplinaId="td-1" periodoLetivoId="periodo-1" lancamentos={lancamentos} />,
    );

    await user.type(within(linhaDe('Ana Costa')).getByRole('textbox'), '15');
    await user.click(screen.getByRole('button', { name: 'Salvar notas' }));

    expect(within(linhaDe('Ana Costa')).getByRole('alert')).toHaveTextContent('A nota máxima é 10');
    expect(lancarNota).not.toHaveBeenCalled();
  });

  it('lança uma nota válida e atualiza a página', async () => {
    vi.mocked(lancarNota).mockResolvedValue({ id: 'nota-1' });
    const user = userEvent.setup({ delay: null });
    render(
      <NotasForm turmaDisciplinaId="td-1" periodoLetivoId="periodo-1" lancamentos={lancamentos} />,
    );

    await user.type(within(linhaDe('Ana Costa')).getByRole('textbox'), '8');
    await user.click(screen.getByRole('button', { name: 'Salvar notas' }));

    expect(lancarNota).toHaveBeenCalledWith({
      alunoId: 'aluno-ana',
      turmaDisciplinaId: 'td-1',
      periodoLetivoId: 'periodo-1',
      valor: 8,
    });
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });

  it('mostra erro geral quando a API falha', async () => {
    vi.mocked(lancarNota).mockRejectedValue(new Error('falhou'));
    const user = userEvent.setup({ delay: null });
    render(
      <NotasForm turmaDisciplinaId="td-1" periodoLetivoId="periodo-1" lancamentos={lancamentos} />,
    );

    await user.type(within(linhaDe('Ana Costa')).getByRole('textbox'), '8');
    await user.click(screen.getByRole('button', { name: 'Salvar notas' }));

    expect(
      await screen.findByText('Não foi possível salvar as notas. Tente novamente.'),
    ).toBeInTheDocument();
  });
});
