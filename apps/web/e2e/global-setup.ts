import { execSync } from 'node:child_process';

/**
 * Estado determinístico antes da suíte inteira: trunca as tabelas que o seed
 * não escreve via upsert (Recado, Evento, Ocorrencia, Movimentacao — ver
 * dívida em docs/roadmap.md) e resemeia. Pressupõe o Postgres do
 * `pnpm infra:up` (container `arbora-postgres`) já rodando.
 */
export default function globalSetup(): void {
  const opcoes = { stdio: 'inherit' as const };

  execSync(
    'docker exec arbora-postgres psql -U arbora -d arbora -c ' +
      '"TRUNCATE recados, recado_confirmacoes_leitura, eventos, ocorrencias, movimentacoes RESTART IDENTITY CASCADE;"',
    opcoes,
  );
  execSync('pnpm --filter @arbora/api db:seed', opcoes);
}
