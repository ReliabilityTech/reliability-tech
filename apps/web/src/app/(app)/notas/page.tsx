import { type BadgeTone, StatusBadge } from '@/components/status-badge';
import { requireRole } from '@/lib/server-session';

const LANCAMENTOS = [
  { nome: 'Ana Ferreira', nota: '8,5', situacao: 'Aprovado' as const, observacao: '' },
  {
    nome: 'Bruno Santos',
    nota: '4,2',
    situacao: 'Atenção' as const,
    observacao: 'Precisa revisar o Capítulo 4',
  },
  {
    nome: 'Carla Cavalcanti',
    nota: 'AUS',
    situacao: 'Ausente' as const,
    observacao: 'Atestado médico apresentado',
  },
  { nome: 'Diego Martins', nota: '—', situacao: 'Sem nota' as const, observacao: '' },
  {
    nome: 'Eduardo Lima',
    nota: '12,0',
    situacao: 'Erro' as const,
    observacao: 'Nota acima do máximo permitido',
  },
] as const;

const SITUACAO_TONE: Record<(typeof LANCAMENTOS)[number]['situacao'], BadgeTone> = {
  Aprovado: 'success',
  Atenção: 'warning',
  Ausente: 'neutral',
  'Sem nota': 'neutral',
  Erro: 'danger',
};

export default async function LancamentoNotasPage() {
  await requireRole(['PROFESSOR']);

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lançamento de notas</h1>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Matemática · 5º Ano B · 1º Bimestre
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-(--radius-card) border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
          >
            Salvar rascunho
          </button>
          <button
            type="button"
            className="rounded-(--radius-card) bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white"
          >
            Publicar notas
          </button>
        </div>
      </header>

      <div className="rounded-(--radius-card) overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-foreground-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Aluno</th>
              <th className="px-4 py-3 font-medium">Nota (0-10)</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3 font-medium">Observação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {LANCAMENTOS.map((linha) => (
              <tr key={linha.nome}>
                <td className="px-4 py-3 font-medium">{linha.nome}</td>
                <td className="px-4 py-3">
                  <input
                    defaultValue={linha.nota}
                    className={`rounded-(--radius-card) w-16 border px-2 py-1 text-sm ${
                      linha.situacao === 'Erro'
                        ? 'border-[var(--color-danger)] text-[var(--color-danger)]'
                        : 'border-[var(--color-border)]'
                    }`}
                  />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={SITUACAO_TONE[linha.situacao]}>{linha.situacao}</StatusBadge>
                </td>
                <td className="px-4 py-3 italic text-[var(--color-foreground-muted)]">
                  {linha.observacao || 'Adicionar nota...'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
        {LANCAMENTOS.length} de 28 alunos
      </p>
    </div>
  );
}
