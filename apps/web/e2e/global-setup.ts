import { execSync } from 'node:child_process';

/**
 * Estado determinístico antes da suíte inteira: trunca `tenants` e `users`
 * (CASCADE arrasta tudo que pende deles — turmas, alunos, recados, eventos,
 * aluno_responsaveis etc., transitivamente) e resemeia.
 *
 * Antes truncava só as tabelas que o seed não escreve via upsert (Recado,
 * Evento, Ocorrencia, Movimentacao — dívida em docs/roadmap.md), confiando
 * que o resto ficava consistente por upsert. Faltava um caso: os próprios
 * testes E2E de escrita criam registros com chave fixa fora do seed —
 * "Aluno E2E" (matrícula `e2e-0001`), "Responsável E2E"
 * (`responsavel-e2e@exemplo.com`), "Escola E2E" — que sobreviviam de uma run
 * pra outra e quebravam a run seguinte com 409 de matrícula/e-mail/slug
 * duplicado (indistinguível de falha real no primeiro sintoma: o dialog de
 * cadastro não fecha, mesmo texto genérico de erro). Truncar a partir da
 * raiz do grafo de FK evita ter que manter esta lista em dia a cada novo
 * teste de escrita.
 *
 * Pressupõe o Postgres do `pnpm infra:up` (container `arbora-postgres`) já
 * rodando.
 */
export default function globalSetup(): void {
  const opcoes = { stdio: 'inherit' as const };

  execSync(
    'docker exec arbora-postgres psql -U arbora -d arbora -c ' +
      '"TRUNCATE tenants, users RESTART IDENTITY CASCADE;"',
    opcoes,
  );
  execSync('pnpm --filter @arbora/api db:seed', opcoes);
}
