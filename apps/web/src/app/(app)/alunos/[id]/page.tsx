import { AlertTriangle, Mail, TrendingUp } from 'lucide-react';
import { notFound } from 'next/navigation';

import { buscarAlunoPerfil } from '@/lib/alunos';
import { ApiRequestError } from '@/lib/api-client';
import { requireRole } from '@/lib/server-session';

import { RemoverResponsavelButton } from './remover-responsavel-button';
import { VincularResponsavelDialog } from './vincular-responsavel-dialog';

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
}

function formatarQuando(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function PerfilAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR']);
  const { id } = await params;

  const aluno = await buscarAlunoPerfil(id).catch((error: unknown) => {
    if (error instanceof ApiRequestError && error.statusCode === 404) notFound();
    throw error;
  });

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-xl font-bold text-[var(--color-brand-600)]">
          {iniciais(aluno.nome)}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{aluno.nome}</h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Matrícula {aluno.matricula} · {aluno.turmaNome ?? 'Sem turma'}
          </p>
        </div>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <TrendingUp className="mb-2 h-4 w-4 text-[var(--color-brand-600)]" aria-hidden />
          <p className="text-2xl font-bold">
            {aluno.mediaGeral === null
              ? '—'
              : aluno.mediaGeral.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
          </p>
          <p className="text-xs text-[var(--color-foreground-muted)]">Média geral</p>
        </div>
        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <TrendingUp className="mb-2 h-4 w-4 text-[var(--color-brand-600)]" aria-hidden />
          <p className="text-2xl font-bold">
            {aluno.frequencia === null ? '—' : `${aluno.frequencia}%`}
          </p>
          <p className="text-xs text-[var(--color-foreground-muted)]">Frequência (30 dias)</p>
        </div>
        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <AlertTriangle className="mb-2 h-4 w-4 text-[var(--color-danger)]" aria-hidden />
          <p className="text-2xl font-bold">{aluno.alertas.length}</p>
          <p className="text-xs text-[var(--color-foreground-muted)]">Exigem atenção imediata</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Responsáveis vinculados</h2>
            <VincularResponsavelDialog alunoId={aluno.id} />
          </div>
          {aluno.responsaveis.length === 0 ? (
            <p className="text-sm text-[var(--color-foreground-muted)]">
              Nenhum responsável vinculado.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {aluno.responsaveis.map((resp) => (
                <div
                  key={resp.id}
                  className="rounded-(--radius-card) border border-[var(--color-border)] p-3 text-sm"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="font-medium">{resp.nome}</p>
                    <RemoverResponsavelButton alunoId={aluno.id} responsavelId={resp.id} />
                  </div>
                  <p className="mb-2 capitalize text-[var(--color-foreground-muted)]">
                    {resp.parentesco}
                  </p>
                  <p className="mb-2 flex items-center gap-2 text-[var(--color-foreground-muted)]">
                    <Mail className="h-3.5 w-3.5" aria-hidden /> {resp.email}
                  </p>
                  {resp.podeRetirar && (
                    <span className="bg-[var(--color-success)]/15 rounded-full px-2 py-0.5 text-xs font-medium text-[var(--color-success)]">
                      Autorizado a retirar
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-(--radius-card) border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 border p-4">
            <h2 className="mb-2 font-semibold text-[var(--color-danger)]">Alertas</h2>
            {aluno.alertas.length === 0 ? (
              <p className="text-sm text-[var(--color-foreground-muted)]">Nenhum alerta.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {aluno.alertas.map((alerta, indice) => (
                  <li key={indice}>
                    <p className="font-medium">{alerta.titulo}</p>
                    <p className="text-[var(--color-foreground-muted)]">{alerta.descricao}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="mb-2 font-semibold">Eventos recentes</h2>
            {aluno.eventosRecentes.length === 0 ? (
              <p className="text-sm text-[var(--color-foreground-muted)]">Nenhum evento recente.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {aluno.eventosRecentes.map((evento, indice) => (
                  <li key={indice}>
                    <p className="text-[var(--color-foreground-muted)]">
                      {formatarQuando(evento.quando)}
                    </p>
                    <p>{evento.descricao}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
