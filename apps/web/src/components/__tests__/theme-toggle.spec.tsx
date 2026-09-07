import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ThemeToggle } from '../theme-toggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('começa em "Automático" quando não há preferência salva', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('combobox', { name: 'Tema' })).toHaveValue('system');
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });

  it('lê a preferência salva em localStorage ao montar', () => {
    localStorage.setItem('arbora-theme', 'dark');
    render(<ThemeToggle />);
    expect(screen.getByRole('combobox', { name: 'Tema' })).toHaveValue('dark');
  });

  it('ignora um valor inválido salvo em localStorage', () => {
    localStorage.setItem('arbora-theme', 'neon');
    render(<ThemeToggle />);
    expect(screen.getByRole('combobox', { name: 'Tema' })).toHaveValue('system');
  });

  it('escolher um tema marca data-theme em <html> e salva em localStorage', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ThemeToggle />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Tema' }), 'high-contrast');

    expect(document.documentElement).toHaveAttribute('data-theme', 'high-contrast');
    expect(localStorage.getItem('arbora-theme')).toBe('high-contrast');
  });

  it('voltar pra "Automático" remove data-theme e limpa o localStorage', async () => {
    const user = userEvent.setup({ delay: null });
    localStorage.setItem('arbora-theme', 'dark');
    render(<ThemeToggle />);
    document.documentElement.setAttribute('data-theme', 'dark');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Tema' }), 'system');

    expect(document.documentElement).not.toHaveAttribute('data-theme');
    expect(localStorage.getItem('arbora-theme')).toBeNull();
  });
});
