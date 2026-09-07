import { listarAlunosDoResponsavel, listarMovimentacoes } from '@/lib/responsavel';

import { ResponsavelDashboardClient } from './responsavel-dashboard-client';

export async function ResponsavelDashboard() {
  const alunos = await listarAlunosDoResponsavel();
  const primeiroAluno = alunos[0];

  if (!primeiroAluno) {
    return (
      <div className="mx-auto max-w-sm p-4">
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Nenhum aluno vinculado à sua conta ainda.
        </p>
      </div>
    );
  }

  const movimentacoes = await listarMovimentacoes(primeiroAluno.id);

  return (
    <ResponsavelDashboardClient
      alunos={alunos}
      alunoInicialId={primeiroAluno.id}
      movimentacoesIniciais={movimentacoes}
    />
  );
}
