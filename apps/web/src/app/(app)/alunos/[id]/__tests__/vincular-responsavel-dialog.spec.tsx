import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { vincularResponsavel } from '@/lib/alunos-client';

import { VincularResponsavelDialog } from '../vincular-responsavel-dialog';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/alunos-client', () => ({
  vincularResponsavel: vi.fn(),
}));

async function abrirDialogo(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup({ delay: null });
  render(<VincularResponsavelDialog alunoId="aluno-1" />);
  await user.click(screen.getByRole('button', { name: 'Vincular responsável' }));
  return user;
}

describe('VincularResponsavelDialog', () => {
  beforeEach(() => {
    vi.mocked(vincularResponsavel).mockReset();
    refresh.mockReset();
  });

  it('parentesco vazio é bloqueado no client antes de ir pra API', async () => {
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Maria Costa');
    await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await user.type(screen.getByLabelText(/^Senha/), 'SenhaForte123');
    // Um espaço passa pelo `required` nativo do input, mas falha no
    // `.trim().min(1)` do schema — é o client-side que precisa bloquear aqui.
    await user.type(screen.getByLabelText('Parentesco'), ' ');
    await user.click(screen.getByRole('button', { name: 'Vincular' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(vincularResponsavel).not.toHaveBeenCalled();
  });

  it('vincula um responsável com conta nova (senha preenchida)', async () => {
    vi.mocked(vincularResponsavel).mockResolvedValue({ id: 'vinculo-1' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Maria Costa');
    await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await user.type(screen.getByLabelText(/^Senha/), 'SenhaForte123');
    await user.type(screen.getByLabelText('Parentesco'), 'mãe');
    await user.click(screen.getByRole('button', { name: 'Vincular' }));

    await vi.waitFor(() => expect(vincularResponsavel).toHaveBeenCalledOnce());
    const [alunoId, payload] = vi.mocked(vincularResponsavel).mock.calls[0]!;
    expect(alunoId).toBe('aluno-1');
    expect(payload).toMatchObject({
      nome: 'Maria Costa',
      email: 'maria@exemplo.com',
      senha: 'SenhaForte123',
      parentesco: 'mãe',
      podeRetirar: true,
    });
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('vincula sem senha (conta já existe) — campo fica vazio e some do payload', async () => {
    vi.mocked(vincularResponsavel).mockResolvedValue({ id: 'vinculo-2' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Maria Costa');
    await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await user.type(screen.getByLabelText('Parentesco'), 'mãe');
    await user.click(screen.getByRole('button', { name: 'Vincular' }));

    await vi.waitFor(() => expect(vincularResponsavel).toHaveBeenCalledOnce());
    const payload = vi.mocked(vincularResponsavel).mock.calls[0]![1];
    expect(payload.senha).toBeUndefined();
  });

  it('desmarcar "autorizado a retirar" manda podeRetirar false', async () => {
    vi.mocked(vincularResponsavel).mockResolvedValue({ id: 'vinculo-3' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Maria Costa');
    await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await user.type(screen.getByLabelText('Parentesco'), 'mãe');
    await user.click(screen.getByLabelText('Autorizado a retirar o aluno'));
    await user.click(screen.getByRole('button', { name: 'Vincular' }));

    await vi.waitFor(() =>
      expect(vincularResponsavel).toHaveBeenCalledWith(
        'aluno-1',
        expect.objectContaining({ podeRetirar: false }),
      ),
    );
  });

  it('mostra erro geral quando a API falha', async () => {
    vi.mocked(vincularResponsavel).mockRejectedValue(new Error('falhou'));
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Maria Costa');
    await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await user.type(screen.getByLabelText(/^Senha/), 'SenhaForte123');
    await user.type(screen.getByLabelText('Parentesco'), 'mãe');
    await user.click(screen.getByRole('button', { name: 'Vincular' }));

    expect(
      await screen.findByText('Não foi possível vincular o responsável. Tente novamente.'),
    ).toBeInTheDocument();
  });
});
