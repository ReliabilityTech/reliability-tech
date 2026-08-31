'use client';

import { type NotaLancamentoItem, type SituacaoNota } from '@arbora/contracts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { type BadgeTone, StatusBadge } from '@/components/status-badge';
import { lancarNota } from '@/lib/professor-client';

const NOTA_APROVACAO_MINIMA = 6;

const SITUACAO_LABEL: Record<SituacaoNota, string> = {
  APROVADO: 'Aprovado',
  ATENCAO: 'Atenção',
  SEM_NOTA: 'Sem nota',
};

const SITUACAO_TONE: Record<SituacaoNota, BadgeTone> = {
  APROVADO: 'success',
  ATENCAO: 'warning',
  SEM_NOTA: 'neutral',
};

function situacaoLocal(valor: string): SituacaoNota {
  const numero = Number(valor.replace(',', '.'));
  if (valor.trim() === '' || Number.isNaN(numero)) return 'SEM_NOTA';
  return numero >= NOTA_APROVACAO_MINIMA ? 'APROVADO' : 'ATENCAO';
}

export function NotasForm({
  turmaDisciplinaId,
  periodoLetivoId,
  lancamentos,
}: {
  turmaDisciplinaId: string;
  periodoLetivoId: string;
  lancamentos: NotaLancamentoItem[];
}) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(lancamentos.map((item) => [item.alunoId, item.valor?.toString() ?? ''])),
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handlePublicar(): Promise<void> {
    setSalvando(true);
    setErro(null);
    try {
      const pendentes = lancamentos
        .map((item) => ({ alunoId: item.alunoId, texto: valores[item.alunoId] ?? '' }))
        .filter(({ texto }) => texto.trim() !== '')
        .map(({ alunoId, texto }) => ({ alunoId, valor: Number(texto.replace(',', '.')) }));

      await Promise.all(
        pendentes.map(({ alunoId, valor }) =>
          lancarNota({ alunoId, turmaDisciplinaId, periodoLetivoId, valor }),
        ),
      );
      router.refresh();
    } catch {
      setErro('Não foi possível salvar as notas. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        {erro && <p className="mr-auto text-sm text-[var(--color-danger)]">{erro}</p>}
        <button
          type="button"
          onClick={() => void handlePublicar()}
          disabled={salvando}
          className="rounded-(--radius-card) bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {salvando ? 'Salvando…' : 'Salvar notas'}
        </button>
      </div>

      <div className="rounded-(--radius-card) overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-foreground-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Aluno</th>
              <th className="px-4 py-3 font-medium">Nota (0-10)</th>
              <th className="px-4 py-3 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {lancamentos.map((linha) => {
              const valorAtual = valores[linha.alunoId] ?? '';
              const situacao = situacaoLocal(valorAtual);
              return (
                <tr key={linha.alunoId}>
                  <td className="px-4 py-3 font-medium">{linha.alunoNome}</td>
                  <td className="px-4 py-3">
                    <input
                      value={valorAtual}
                      onChange={(evento) =>
                        setValores((atual) => ({ ...atual, [linha.alunoId]: evento.target.value }))
                      }
                      className="rounded-(--radius-card) w-16 border border-[var(--color-border)] px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={SITUACAO_TONE[situacao]}>
                      {SITUACAO_LABEL[situacao]}
                    </StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
        {lancamentos.length} aluno{lancamentos.length === 1 ? '' : 's'}
      </p>
    </div>
  );
}
