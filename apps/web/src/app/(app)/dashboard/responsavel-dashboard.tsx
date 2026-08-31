import { LogIn, LogOut } from 'lucide-react';

const MOVIMENTACOES = [
  { tipo: 'saida' as const, quando: 'Hoje, 17:32', descricao: 'Saída registrada na portaria' },
  { tipo: 'entrada' as const, quando: 'Hoje, 07:48', descricao: 'Entrada registrada na portaria' },
];

/** Mobile-first: o protótipo do Stitch desenha essa tela em 390px de largura. */
export function ResponsavelDashboard({ nomeAluno }: { nomeAluno: string }) {
  return (
    <div className="mx-auto max-w-sm p-4">
      <label className="mb-4 block text-sm font-medium">
        Aluno
        <select className="rounded-(--radius-card) mt-1 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
          <option>{nomeAluno}</option>
        </select>
      </label>

      <section className="rounded-(--radius-card) mb-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold">Movimentações recentes</h2>
        <ul className="flex flex-col gap-3">
          {MOVIMENTACOES.map((mov) => (
            <li key={mov.quando} className="flex items-center gap-3 text-sm">
              <span
                className={`rounded-full p-2 ${mov.tipo === 'entrada' ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]' : 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)]'}`}
              >
                {mov.tipo === 'entrada' ? (
                  <LogIn className="h-4 w-4" aria-hidden />
                ) : (
                  <LogOut className="h-4 w-4" aria-hidden />
                )}
              </span>
              <div>
                <p className="font-medium">{mov.descricao}</p>
                <p className="text-[var(--color-foreground-muted)]">{mov.quando}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-1 text-sm font-semibold">Central de autorizações</h2>
        <p className="mb-3 text-sm text-[var(--color-foreground-muted)]">
          Pessoas autorizadas a retirar {nomeAluno.split(' ')[0]}.
        </p>
        <button
          type="button"
          className="rounded-(--radius-card) w-full bg-[var(--color-brand-600)] px-3 py-2 text-sm font-semibold text-white"
        >
          Gerenciar autorizados
        </button>
      </section>
    </div>
  );
}
