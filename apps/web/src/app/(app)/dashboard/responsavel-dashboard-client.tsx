'use client';

import { type MovimentacaoItem, type ResponsavelAlunoResumo } from '@arbora/contracts';
import { LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';

import { listarMovimentacoesClient } from '@/lib/responsavel-client';

function formatarQuando(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Mobile-first: o protótipo do Stitch desenha essa tela em 390px de largura. */
export function ResponsavelDashboardClient({
  alunos,
  alunoInicialId,
  movimentacoesIniciais,
}: {
  alunos: ResponsavelAlunoResumo[];
  alunoInicialId: string;
  movimentacoesIniciais: MovimentacaoItem[];
}) {
  const [alunoId, setAlunoId] = useState(alunoInicialId);
  const [movimentacoes, setMovimentacoes] = useState(movimentacoesIniciais);
  const [carregando, setCarregando] = useState(false);

  const alunoSelecionado = alunos.find((aluno) => aluno.id === alunoId);

  async function handleTrocarAluno(id: string): Promise<void> {
    setAlunoId(id);
    setCarregando(true);
    try {
      setMovimentacoes(await listarMovimentacoesClient(id));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm p-4">
      <label className="mb-4 block text-sm font-medium">
        Aluno
        <select
          value={alunoId}
          onChange={(evento) => void handleTrocarAluno(evento.target.value)}
          className="rounded-(--radius-card) mt-1 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          {alunos.map((aluno) => (
            <option key={aluno.id} value={aluno.id}>
              {aluno.nome}
            </option>
          ))}
        </select>
      </label>

      <section className="rounded-(--radius-card) mb-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold">Movimentações recentes</h2>
        {carregando ? (
          <p className="text-sm text-[var(--color-foreground-muted)]">Carregando…</p>
        ) : movimentacoes.length === 0 ? (
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Nenhuma movimentação registrada.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {movimentacoes.map((mov) => (
              <li key={mov.id} className="flex items-center gap-3 text-sm">
                <span
                  className={`rounded-full p-2 ${mov.tipo === 'ENTRADA' ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]' : 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)]'}`}
                >
                  {mov.tipo === 'ENTRADA' ? (
                    <LogIn className="h-4 w-4" aria-hidden />
                  ) : (
                    <LogOut className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <div>
                  <p className="font-medium">
                    {mov.tipo === 'ENTRADA' ? 'Entrada registrada' : 'Saída registrada'}
                  </p>
                  <p className="text-[var(--color-foreground-muted)]">
                    {formatarQuando(mov.quando)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-1 text-sm font-semibold">Central de autorizações</h2>
        <p className="mb-3 text-sm text-[var(--color-foreground-muted)]">
          Pessoas autorizadas a retirar {alunoSelecionado?.nome.split(' ')[0] ?? 'o aluno'}.
        </p>
        <button
          type="button"
          disabled
          className="rounded-(--radius-card) w-full bg-[var(--color-brand-600)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Gerenciar autorizados (em breve)
        </button>
      </section>
    </div>
  );
}
