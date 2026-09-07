import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { criarTenant } from '@/lib/tenants-client';

import { NovaInstituicaoDialog } from '../nova-instituicao-dialog';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/tenants-client', () => ({
  criarTenant: vi.fn(),
}));

async function abrirDialogo(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup({ delay: null });
  render(<NovaInstituicaoDialog />);
  await user.click(screen.getByRole('button', { name: 'Nova instituição' }));
  return user;
}

describe('NovaInstituicaoDialog', () => {
  beforeEach(() => {
    vi.mocked(criarTenant).mockReset();
    refresh.mockReset();
  });

  it('slug com maiúscula é bloqueado no client antes de ir pra API', async () => {
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Colégio Exemplo');
    await user.type(screen.getByLabelText('Identificador (slug)'), 'Colegio-Exemplo');
    await user.type(screen.getByLabelText('Plano'), 'piloto');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Use apenas letras minúsculas, números e hífen',
    );
    expect(criarTenant).not.toHaveBeenCalled();
  });

  it('cadastra uma instituição válida e atualiza a página', async () => {
    vi.mocked(criarTenant).mockResolvedValue({ id: 'tenant-1' });
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Colégio Exemplo');
    await user.type(screen.getByLabelText('Identificador (slug)'), 'colegio-exemplo');
    await user.type(screen.getByLabelText('Plano'), 'piloto');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await vi.waitFor(() =>
      expect(criarTenant).toHaveBeenCalledWith({
        nome: 'Colégio Exemplo',
        slug: 'colegio-exemplo',
        plano: 'piloto',
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('mostra erro geral quando a API falha', async () => {
    vi.mocked(criarTenant).mockRejectedValue(new Error('falhou'));
    const user = await abrirDialogo();

    await user.type(screen.getByLabelText('Nome'), 'Colégio Exemplo');
    await user.type(screen.getByLabelText('Identificador (slug)'), 'colegio-exemplo');
    await user.type(screen.getByLabelText('Plano'), 'piloto');
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(
      await screen.findByText('Não foi possível cadastrar a instituição. Tente novamente.'),
    ).toBeInTheDocument();
  });
});
