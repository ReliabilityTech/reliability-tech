import { type TurmaDisciplinaResumo } from '@arbora/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { criarRecado } from '@/lib/recados-client';

import { NovoRecadoDialog } from '../novo-recado-dialog';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/recados-client', () => ({
  criarRecado: vi.fn(),
}));

const turmas: TurmaDisciplinaResumo[] = [
  { id: 'td-1', turmaId: 'turma-1', turmaNome: '5º Ano A', disciplinaNome: 'Matemática' },
];

async function abrirDialogo(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup({ delay: null });
  render(<NovoRecadoDialog turmas={turmas} />);
  await user.click(screen.getByRole('button', { name: 'Novo comunicado' }));
  return user;
}

describe('NovoRecadoDialog', () => {
  beforeEach(() => {
    vi.mocked(criarRecado).mockReset();
    refresh.mockReset();
  });

  it('só mostra o seletor de turma quando o destinatário é "Uma turma"', async () => {
    const user = await abrirDialogo();

    expect(screen.queryByLabelText('Turma')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Destinatário'), 'TURMA');
    expect(screen.getByLabelText('Turma')).toBeInTheDocument();
  });

  it('título vazio é bloqueado no client antes de ir pra API', async () => {
    const user = await abrirDialogo();

    // Espaço, não string vazia: satisfaz o `required` nativo do input (senão
    // o próprio jsdom bloqueia o submit antes de chegar no handler), mas o
    // Zod (`.trim().min(1)`) rejeita — mesma técnica do E2E (admin.spec.ts).
    await user.type(screen.getByLabelText('Título'), ' ');
    await user.type(screen.getByLabelText('Mensagem'), 'corpo válido');
    await user.click(screen.getByRole('button', { name: 'Publicar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe um título');
    expect(criarRecado).not.toHaveBeenCalled();
  });

  it('publica um comunicado válido pra toda a instituição', async () => {
    vi.mocked(criarRecado).mockResolvedValue({ id: 'recado-1' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Título'), 'Aviso importante');
    await user.type(screen.getByLabelText('Mensagem'), 'Reunião amanhã às 10h.');
    await user.click(screen.getByRole('button', { name: 'Publicar' }));

    await vi.waitFor(() =>
      expect(criarRecado).toHaveBeenCalledWith({
        titulo: 'Aviso importante',
        corpo: 'Reunião amanhã às 10h.',
        destinatario: 'TODA_INSTITUICAO',
        turmaId: undefined,
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('publica um comunicado pra uma turma específica com o turmaId certo', async () => {
    vi.mocked(criarRecado).mockResolvedValue({ id: 'recado-2' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Título'), 'Prova de matemática');
    await user.type(screen.getByLabelText('Mensagem'), 'Sexta-feira, valendo 10 pontos.');
    await user.selectOptions(screen.getByLabelText('Destinatário'), 'TURMA');
    await user.click(screen.getByRole('button', { name: 'Publicar' }));

    await vi.waitFor(() =>
      expect(criarRecado).toHaveBeenCalledWith(
        expect.objectContaining({ destinatario: 'TURMA', turmaId: 'turma-1' }),
      ),
    );
  });

  it('mostra erro geral quando a API falha', async () => {
    vi.mocked(criarRecado).mockRejectedValue(new Error('falhou'));
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Título'), 'Aviso');
    await user.type(screen.getByLabelText('Mensagem'), 'Corpo válido');
    await user.click(screen.getByRole('button', { name: 'Publicar' }));

    expect(
      await screen.findByText('Não foi possível publicar o comunicado. Tente novamente.'),
    ).toBeInTheDocument();
  });
});
