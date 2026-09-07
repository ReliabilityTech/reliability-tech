import { type PresencaItem, type TurmaDisciplinaResumo } from '@arbora/contracts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registrarPresencas } from '@/lib/professor-client';

import { ChamadaList } from '../chamada-list';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
  usePathname: () => '/chamada',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/professor-client', () => ({
  registrarPresencas: vi.fn(),
}));

const turmas: TurmaDisciplinaResumo[] = [
  { id: 'td-1', turmaId: 'turma-1', turmaNome: '5º Ano A', disciplinaNome: 'Matemática' },
];

const presencas: PresencaItem[] = [
  { alunoId: 'aluno-ana', alunoNome: 'Ana Costa', presente: true },
  { alunoId: 'aluno-bruno', alunoNome: 'Bruno Lima', presente: false },
];

function renderizar(): void {
  render(
    <ChamadaList
      turmas={turmas}
      turmaDisciplinaId="td-1"
      data="2026-09-07"
      presencas={presencas}
    />,
  );
}

describe('ChamadaList', () => {
  beforeEach(() => {
    vi.mocked(registrarPresencas).mockReset();
    refresh.mockReset();
  });

  it('alterna a presença de um aluno ao clicar', async () => {
    const user = userEvent.setup({ delay: null });
    renderizar();

    const linhaAna = screen.getByText('Ana Costa').closest('li')!;
    const botaoAna = within(linhaAna).getByRole('button');
    expect(botaoAna).toHaveAttribute('aria-pressed', 'true');

    await user.click(botaoAna);

    expect(within(linhaAna).getByRole('button', { name: 'Falta' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('"marcar todos como presentes" vira Falta em Presente pra todo mundo', async () => {
    const user = userEvent.setup({ delay: null });
    renderizar();

    await user.click(screen.getByRole('button', { name: 'Marcar todos como presentes' }));

    const botoes = screen.getAllByRole('button', { pressed: true });
    expect(botoes).toHaveLength(2);
  });

  it('a busca filtra a lista por nome', async () => {
    const user = userEvent.setup({ delay: null });
    renderizar();

    await user.type(screen.getByLabelText('Buscar aluno'), 'bru');

    expect(screen.queryByText('Ana Costa')).not.toBeInTheDocument();
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
  });

  it('busca sem resultado mostra "nenhum aluno encontrado"', async () => {
    const user = userEvent.setup({ delay: null });
    renderizar();

    await user.type(screen.getByLabelText('Buscar aluno'), 'zzz');

    expect(screen.getByText('Nenhum aluno encontrado.')).toBeInTheDocument();
  });

  it('salvar chamada envia o estado atual de presença e atualiza a página', async () => {
    vi.mocked(registrarPresencas).mockResolvedValue({ registrados: 2 });
    const user = userEvent.setup({ delay: null });
    renderizar();

    await user.click(screen.getByRole('button', { name: 'Presente' })); // Ana vira falta
    await user.click(screen.getByRole('button', { name: 'Salvar chamada' }));

    await vi.waitFor(() =>
      expect(registrarPresencas).toHaveBeenCalledWith({
        turmaDisciplinaId: 'td-1',
        data: '2026-09-07',
        registros: [
          { alunoId: 'aluno-ana', presente: false },
          { alunoId: 'aluno-bruno', presente: false },
        ],
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('mostra erro quando salvar falha', async () => {
    vi.mocked(registrarPresencas).mockRejectedValue(new Error('falhou'));
    const user = userEvent.setup({ delay: null });
    renderizar();

    await user.click(screen.getByRole('button', { name: 'Salvar chamada' }));

    expect(
      await screen.findByText('Não foi possível salvar a chamada. Tente novamente.'),
    ).toBeInTheDocument();
  });
});
