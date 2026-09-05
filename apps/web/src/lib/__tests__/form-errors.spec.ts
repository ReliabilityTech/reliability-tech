import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { primeiroErroPorCampo } from '../form-errors';

describe('primeiroErroPorCampo', () => {
  it('mapeia cada issue para o campo raiz correspondente', () => {
    const schema = z.object({ titulo: z.string().min(1, 'Informe um título'), valor: z.number() });
    const resultado = schema.safeParse({ titulo: '', valor: 'x' });

    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    expect(primeiroErroPorCampo(resultado.error.issues)).toEqual({
      titulo: 'Informe um título',
      valor: 'Expected number, received string',
    });
  });

  it('mantém apenas a primeira mensagem quando há mais de um erro no mesmo campo', () => {
    const schema = z.object({ titulo: z.string().min(1).max(3) });
    const resultado = schema.safeParse({ titulo: '' });

    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    expect(Object.keys(primeiroErroPorCampo(resultado.error.issues))).toEqual(['titulo']);
  });

  it('usa "_root" quando o issue não tem path', () => {
    const schema = z.string().refine(() => false, { message: 'Sempre inválido' });
    const resultado = schema.safeParse('qualquer coisa');

    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    expect(primeiroErroPorCampo(resultado.error.issues)).toEqual({ _root: 'Sempre inválido' });
  });
});
