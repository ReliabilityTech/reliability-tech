import { type DashboardAdminResponse } from '@arbora/contracts';
import { AlertTriangle, Bell, TrendingUp, Users } from 'lucide-react';

import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';

const LIMIAR_CRITICO_FREQUENCIA = 75;

function formatarPercentual(valor: number | null): string {
  return valor === null ? '—' : `${valor}%`;
}

function formatarQuando(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminDashboard({ data }: { data: DashboardAdminResponse }) {
  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Visão geral</h1>
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Acompanhe os principais indicadores da instituição.
        </p>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total de alunos" value={String(data.totalAlunos)} />
        <StatCard
          icon={TrendingUp}
          label="Frequência média"
          value={formatarPercentual(data.frequenciaMedia)}
        />
        <StatCard icon={AlertTriangle} label="Faltas hoje" value={String(data.faltasHoje)} />
        <StatCard
          icon={Bell}
          label="Comunicados (7 dias)"
          value={String(data.comunicadosRecentes)}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Atenção necessária</h2>
            <a href="/alunos" className="text-sm font-medium text-[var(--color-link)]">
              Ver todos
            </a>
          </div>
          {data.atencaoNecessaria.length === 0 ? (
            <p className="text-sm text-[var(--color-foreground-muted)]">
              Nenhum aluno abaixo da frequência mínima no momento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-[var(--color-foreground-muted)]">
                  <tr>
                    <th className="py-2 pr-2 font-medium">Nome</th>
                    <th className="py-2 pr-2 font-medium">Turma</th>
                    <th className="py-2 pr-2 font-medium">Frequência</th>
                    <th className="py-2 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {data.atencaoNecessaria.map((aluno) => (
                    <tr key={aluno.alunoId}>
                      <td className="py-2 pr-2 font-medium">{aluno.nome}</td>
                      <td className="py-2 pr-2 text-[var(--color-foreground-muted)]">
                        {aluno.turmaNome ?? '—'}
                      </td>
                      <td className="py-2 pr-2">{aluno.frequencia}%</td>
                      <td className="py-2">
                        <StatusBadge
                          tone={aluno.frequencia < LIMIAR_CRITICO_FREQUENCIA ? 'danger' : 'warning'}
                        >
                          {aluno.frequencia < LIMIAR_CRITICO_FREQUENCIA ? 'Crítico' : 'Alerta'}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 font-semibold">Atividades recentes</h2>
          {data.atividadesRecentes.length === 0 ? (
            <p className="text-sm text-[var(--color-foreground-muted)]">
              Nenhuma atividade registrada ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {data.atividadesRecentes.map((atividade, indice) => (
                <li key={indice}>
                  <p className="font-medium">{atividade.descricao}</p>
                  <p className="text-[var(--color-foreground-muted)]">
                    {formatarQuando(atividade.quando)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
