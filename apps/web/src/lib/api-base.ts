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

/**
 * Cabeçalhos pra chamar a API a partir do servidor do web em nome de um usuário.
 *
 * Sem isso, toda chamada de middleware/Server Component chega à API como o IP
 * da machine do web e o rate limit por IP divide o limite entre todos os
 * usuários. Repassa o `X-Forwarded-For` da requisição original (o cliente e a
 * borda do Fly do web), que deixa a cadeia vista pela API com o mesmo formato
 * das chamadas do navegador via proxy do Next — o `TRUST_PROXY_HOPS` da API
 * (docs/deploy.md) é calibrado pra esse formato.
 *
 * Seguro contra forjar o IP daqui: entradas extras que o cliente mandar ficam
 * à ESQUERDA da cadeia, e a API conta os saltos a partir da direita.
 */
export function forwardClientIp(forwardedFor: string | null | undefined): Record<string, string> {
  return forwardedFor ? { 'x-forwarded-for': forwardedFor } : {};
}
