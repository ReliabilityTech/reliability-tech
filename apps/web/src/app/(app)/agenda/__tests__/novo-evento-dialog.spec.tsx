import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { criarEvento } from '@/lib/eventos-client';

import { NovoEventoDialog } from '../novo-evento-dialog';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/eventos-client', () => ({
  criarEvento: vi.fn(),
}));

async function abrirDialogo(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup({ delay: null });
  render(<NovoEventoDialog />);
  await user.click(screen.getByRole('button', { name: 'Novo evento' }));
  return user;
}

describe('NovoEventoDialog', () => {
  beforeEach(() => {
    vi.mocked(criarEvento).mockReset();
    refresh.mockReset();
  });

  it('data vazia é bloqueada no client antes de ir pra API', async () => {
    const user = await abrirDialogo();
    await user.type(screen.getByLabelText('Título'), 'Reunião de pais');

    // O input de data é `required`: um clique real no botão nunca chega a
    // disparar handleSubmit (a validação HTML5 barra antes, igual num
    // navegador de verdade). fireEvent.submit dispara o evento direto no
    // form, testando o guard manual (`if (!dataInicio)`) como defesa em
    // profundidade caso o `required` um dia seja removido.
    fireEvent.submit(screen.getByRole('button', { name: 'Cadastrar' }).closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe uma data');
    expect(criarEvento).not.toHaveBeenCalled();
  });

  it('constrói a data em meio-dia local, sem cair no dia anterior por fuso', async () => {
    vi.mocked(criarEvento).mockResolvedValue({ id: 'evento-1' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Título'), 'Feriado municipal');
    // <input type="date"> aceita "YYYY-MM-DD" digitado direto.
    await user.type(screen.getByLabelText('Data'), '2026-11-20');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await vi.waitFor(() => expect(criarEvento).toHaveBeenCalled());
    const payload = vi.mocked(criarEvento).mock.calls[0]![0];
    const dataEnviada = new Date(payload.dataInicio);

    expect(dataEnviada.getFullYear()).toBe(2026);
    expect(dataEnviada.getMonth()).toBe(10); // novembro = índice 10
    expect(dataEnviada.getDate()).toBe(20);
  });

  it('cadastra um evento válido e atualiza a página', async () => {
    vi.mocked(criarEvento).mockResolvedValue({ id: 'evento-2' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Título'), 'Prova de história');
    await user.selectOptions(screen.getByLabelText('Tipo'), 'PROVA');
    await user.type(screen.getByLabelText('Data'), '2026-10-05');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await vi.waitFor(() =>
      expect(criarEvento).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'Prova de história', tipo: 'PROVA' }),
      ),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('mostra erro geral quando a API falha', async () => {
    vi.mocked(criarEvento).mockRejectedValue(new Error('falhou'));
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Título'), 'Evento');
    await user.type(screen.getByLabelText('Data'), '2026-10-05');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(
      await screen.findByText('Não foi possível cadastrar o evento. Tente novamente.'),
    ).toBeInTheDocument();
  });
});
