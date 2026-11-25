import { env } from './env';

/**
 * Base da API vista pelo servidor do Next (middleware, Server Components).
 *
 * `NEXT_PUBLIC_API_URL` é o que o NAVEGADOR usa. Em dev é a URL absoluta da API
 * (`http://localhost:3333/api/v1`). Em staging/produção é um caminho relativo
 * (`/api/v1`): o Next repassa essas chamadas à API (`rewrites` em next.config.ts),
 * então o navegador só fala com o host do web e o cookie de sessão (httpOnly,
 * sem `Domain`) fica nele — web e API em `*.fly.dev` são sites diferentes e não
 * compartilhariam cookie.
 *
 * O servidor, que não passa pelo navegador, precisa da URL absoluta: com base
 * relativa, junta `API_ORIGIN` (origem da API) ao caminho.
 */
export function resolveServerApiBase(publicUrl: string, apiOrigin: string | undefined): string {
  if (/^https?:\/\//.test(publicUrl)) return publicUrl;

  if (!apiOrigin) {
    throw new Error(
      `Configuração do front inválida — NEXT_PUBLIC_API_URL é relativa ("${publicUrl}") ` +
        'mas API_ORIGIN (origem absoluta da API) não está definida.',
    );
  }

  return `${apiOrigin.replace(/\/+$/, '')}${publicUrl}`;
}

/** Base absoluta da API para uso no servidor (middleware e Server Components). */
export function getServerApiBase(): string {
  return resolveServerApiBase(env.NEXT_PUBLIC_API_URL, process.env.API_ORIGIN);
}
