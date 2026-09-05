import { describe, expect, it } from 'vitest';

import { loginRequestSchema, passwordSchema } from '../auth';
import { buildPaginationMeta, paginationQuerySchema } from '../common/pagination';
import {
  criarEventoRequestSchema,
  criarRecadoRequestSchema,
  lancarNotaRequestSchema,
} from '../views';

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

describe('criarRecadoRequestSchema', () => {
  it('rejeita título vazio com mensagem em português', () => {
    const resultado = criarRecadoRequestSchema.safeParse({
      titulo: '   ',
      corpo: 'Corpo válido',
      destinatario: 'TODA_INSTITUICAO',
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe('Informe um título');
    }
  });

  it('rejeita mensagem vazia com mensagem em português', () => {
    const resultado = criarRecadoRequestSchema.safeParse({
      titulo: 'Título válido',
      corpo: '',
      destinatario: 'TODA_INSTITUICAO',
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe('Informe a mensagem');
    }
  });

  it('aceita um payload válido', () => {
    expect(
      criarRecadoRequestSchema.safeParse({
        titulo: 'Aviso',
        corpo: 'Reunião amanhã',
        destinatario: 'TODA_INSTITUICAO',
      }).success,
    ).toBe(true);
  });
});

describe('criarEventoRequestSchema', () => {
  it('rejeita título acima de 200 caracteres', () => {
    const resultado = criarEventoRequestSchema.safeParse({
      titulo: 'a'.repeat(201),
      tipo: 'EVENTO',
      dataInicio: '2026-09-20T12:00:00.000Z',
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe('O título pode ter no máximo 200 caracteres');
    }
  });
});

describe('lancarNotaRequestSchema', () => {
  const base = {
    alunoId: 'aluno-1',
    turmaDisciplinaId: 'td-1',
    periodoLetivoId: 'periodo-1',
  };

  it('rejeita nota negativa', () => {
    const resultado = lancarNotaRequestSchema.safeParse({ ...base, valor: -1 });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe('A nota não pode ser negativa');
    }
  });

  it('rejeita nota acima de 10', () => {
    const resultado = lancarNotaRequestSchema.safeParse({ ...base, valor: 10.5 });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe('A nota máxima é 10');
    }
  });

  it('aceita notas dentro do intervalo 0-10', () => {
    expect(lancarNotaRequestSchema.safeParse({ ...base, valor: 7.5 }).success).toBe(true);
  });
});
