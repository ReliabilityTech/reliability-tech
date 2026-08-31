import { AlertTriangle, Mail, Phone, Star, TrendingUp } from 'lucide-react';

import { requireRole } from '@/lib/server-session';

const RESPONSAVEIS = [
  {
    nome: 'Maria Heloisa da Silva',
    principal: true,
    vinculo: 'Mãe · Financeira, Acadêmica',
    telefone: '(11) 98765-4321',
    email: 'm.heloisa@email.com',
    podeRetirar: true,
  },
  {
    nome: 'Ricardo Alves Pereira',
    principal: false,
    vinculo: 'Pai · Acadêmica',
    telefone: '(11) 91234-5678',
    email: 'ricardo.alves@email.com',
    podeRetirar: false,
  },
] as const;

const ALERTAS = [
  { titulo: 'Documento pendente', descricao: 'Cópia do RG vencida' },
  { titulo: 'Baixa médica', descricao: 'Atestado pendente até 12/05' },
] as const;

const EVENTOS_RECENTES = [
  { quando: '12 Mar, 09:00', descricao: 'Ausência registrada — falta na 3ª aula' },
  { quando: '10 Mar, 14:20', descricao: 'Nota lançada em Matemática' },
] as const;

export default async function PerfilAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR']);
  await params;

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-xl font-bold text-[var(--color-brand-600)]">
          JP
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">João Pedro da Silva</h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Matrícula 2026-00152 · 5º Ano A
          </p>
        </div>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <Star className="mb-2 h-4 w-4 text-[var(--color-brand-600)]" aria-hidden />
          <p className="text-2xl font-bold">7,8</p>
          <p className="text-xs text-[var(--color-foreground-muted)]">Média geral</p>
        </div>
        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <TrendingUp className="mb-2 h-4 w-4 text-[var(--color-brand-600)]" aria-hidden />
          <p className="text-2xl font-bold">92%</p>
          <p className="text-xs text-[var(--color-foreground-muted)]">Meta institucional: 85%</p>
        </div>
        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <AlertTriangle className="mb-2 h-4 w-4 text-[var(--color-danger)]" aria-hidden />
          <p className="text-2xl font-bold">{ALERTAS.length}</p>
          <p className="text-xs text-[var(--color-foreground-muted)]">Exigem atenção imediata</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Responsáveis vinculados</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {RESPONSAVEIS.map((resp) => (
              <div
                key={resp.nome}
                className="rounded-(--radius-card) border border-[var(--color-border)] p-3 text-sm"
              >
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-medium">{resp.nome}</p>
                  {resp.principal && (
                    <span className="rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-brand-600)]">
                      Principal
                    </span>
                  )}
                </div>
                <p className="mb-2 text-[var(--color-foreground-muted)]">{resp.vinculo}</p>
                <p className="flex items-center gap-2 text-[var(--color-foreground-muted)]">
                  <Phone className="h-3.5 w-3.5" aria-hidden /> {resp.telefone}
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
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-(--radius-card) border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 border p-4">
            <h2 className="mb-2 font-semibold text-[var(--color-danger)]">Alertas</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {ALERTAS.map((alerta) => (
                <li key={alerta.titulo}>
                  <p className="font-medium">{alerta.titulo}</p>
                  <p className="text-[var(--color-foreground-muted)]">{alerta.descricao}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="mb-2 font-semibold">Eventos recentes</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {EVENTOS_RECENTES.map((evento) => (
                <li key={evento.quando}>
                  <p className="text-[var(--color-foreground-muted)]">{evento.quando}</p>
                  <p>{evento.descricao}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
