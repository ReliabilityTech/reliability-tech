import { describe, expect, it } from 'vitest';

import { loginRequestSchema, passwordSchema } from '../auth';
import { buildPaginationMeta, paginationQuerySchema } from '../common/pagination';

describe('paginationQuerySchema', () => {
  it('aplica os valores padrão quando a query vem vazia', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20, order: 'asc' });
  });

  it('converte strings de query string em números', () => {
    const parsed = paginationQuerySchema.parse({ page: '3', pageSize: '50' });
    expect(parsed.page).toBe(3);
    expect(parsed.pageSize).toBe(50);
  });

  it('rejeita pageSize acima do limite máximo', () => {
    expect(paginationQuerySchema.safeParse({ pageSize: 500 }).success).toBe(false);
  });
});

describe('buildPaginationMeta', () => {
  it('calcula o total de páginas arredondando para cima', () => {
    expect(buildPaginationMeta(1, 20, 41).totalPages).toBe(3);
  });

  it('retorna zero páginas quando não há itens', () => {
    expect(buildPaginationMeta(1, 20, 0).totalPages).toBe(0);
  });
});

describe('loginRequestSchema', () => {
  it('normaliza o e-mail para minúsculas e sem espaços', () => {
    const parsed = loginRequestSchema.parse({ email: '  Ana@Arbora.COM ', password: 'segredo' });
    expect(parsed.email).toBe('ana@arbora.com');
  });
});

describe('passwordSchema', () => {
  it.each([
    ['curta1A', 'menos de 12 caracteres'],
    ['semmaiuscula123', 'sem letra maiúscula'],
    ['SEMMINUSCULA123', 'sem letra minúscula'],
    ['SemNumeroAqui', 'sem número'],
  ])('rejeita "%s" (%s)', (senha) => {
    expect(passwordSchema.safeParse(senha).success).toBe(false);
  });

  it('aceita uma senha que cumpre todas as regras', () => {
    expect(passwordSchema.safeParse('SenhaForte2026').success).toBe(true);
  });
});
