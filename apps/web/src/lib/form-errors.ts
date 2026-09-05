import { type ZodIssue } from 'zod';

/**
 * Primeira mensagem de erro por campo raiz do payload — suficiente pros
 * formulários de uma tela só (sem campos aninhados profundos).
 */
export function primeiroErroPorCampo(issues: ZodIssue[]): Record<string, string> {
  const erros: Record<string, string> = {};
  for (const issue of issues) {
    const campo = String(issue.path[0] ?? '_root');
    erros[campo] ??= issue.message;
  }
  return erros;
}
