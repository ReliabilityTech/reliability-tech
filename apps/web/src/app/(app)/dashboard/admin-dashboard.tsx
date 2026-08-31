import { AlertTriangle, Bell, TrendingUp, Users } from 'lucide-react';

import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';

const ATENCAO_NECESSARIA = [
  { nome: 'Lucas Oliveira', turma: '9º Ano A', frequencia: '78%', faltas: 12, nivel: 'Crítico' },
  { nome: 'Beatriz Santos', turma: '5º Ano B', frequencia: '82%', faltas: 8, nivel: 'Alerta' },
  { nome: 'Gabriel Costa', turma: '6º Ano C', frequencia: '85%', faltas: 6, nivel: 'Alerta' },
  {
    nome: 'Mariana Lima',
    turma: '1º Ens. Médio A',
    frequencia: '75%',
    faltas: 15,
    nivel: 'Crítico',
  },
] as const;

const ATIVIDADES_RECENTES = [
  { titulo: 'Nota lançada', descricao: 'Prof. Marcos alterou uma nota de Matemática' },
  { titulo: 'Novo comunicado', descricao: 'Comunicado enviado para "Festa Junina"' },
  { titulo: 'Ocorrência', descricao: 'Registrado incidente disciplinar' },
  { titulo: 'Nova matrícula', descricao: 'Matrícula concluída para Wandersley' },
] as const;

export function AdminDashboard() {
  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Visão geral</h1>
        <p className="text-sm text-[var(--color-foreground-muted)]">
          Acompanhe os principais indicadores da instituição.
        </p>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total de alunos" value="820" hint="+12 este mês" />
        <StatCard icon={TrendingUp} label="Frequência média" value="94,7%" hint="Meta: 95%" />
        <StatCard icon={AlertTriangle} label="Faltas hoje" value="18" hint="-2% vs. ontem" />
        <StatCard icon={Bell} label="Comunicados pendentes" value="4" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Atenção necessária</h2>
            <a href="/alunos" className="text-sm font-medium text-[var(--color-brand-600)]">
              Ver todos
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--color-foreground-muted)]">
                <tr>
                  <th className="py-2 pr-2 font-medium">Nome</th>
                  <th className="py-2 pr-2 font-medium">Turma</th>
                  <th className="py-2 pr-2 font-medium">Frequência</th>
                  <th className="py-2 pr-2 font-medium">Faltas</th>
                  <th className="py-2 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {ATENCAO_NECESSARIA.map((aluno) => (
                  <tr key={aluno.nome}>
                    <td className="py-2 pr-2 font-medium">{aluno.nome}</td>
                    <td className="py-2 pr-2 text-[var(--color-foreground-muted)]">
                      {aluno.turma}
                    </td>
                    <td className="py-2 pr-2">{aluno.frequencia}</td>
                    <td className="py-2 pr-2">{aluno.faltas}</td>
                    <td className="py-2">
                      <StatusBadge tone={aluno.nivel === 'Crítico' ? 'danger' : 'warning'}>
                        {aluno.nivel}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 font-semibold">Atividades recentes</h2>
          <ul className="flex flex-col gap-3 text-sm">
            {ATIVIDADES_RECENTES.map((atividade) => (
              <li key={atividade.titulo}>
                <p className="font-medium">{atividade.titulo}</p>
                <p className="text-[var(--color-foreground-muted)]">{atividade.descricao}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
