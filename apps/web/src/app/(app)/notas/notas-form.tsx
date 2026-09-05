'use client';

import {
  type LancarNotaRequest,
  lancarNotaRequestSchema,
  type NotaLancamentoItem,
  type SituacaoNota,
} from '@arbora/contracts';
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
  const [erros, setErros] = useState<Record<string, string>>({});

  async function handlePublicar(): Promise<void> {
    setErros({});

    const candidatos = lancamentos
      .map((item) => ({ alunoId: item.alunoId, texto: valores[item.alunoId] ?? '' }))
      .filter(({ texto }) => texto.trim() !== '')
      .map(({ alunoId, texto }) => ({
        alunoId,
        turmaDisciplinaId,
        periodoLetivoId,
        valor: Number(texto.replace(',', '.')),
      }));

    const errosPorAluno: Record<string, string> = {};
    const pendentes: LancarNotaRequest[] = [];
    for (const candidato of candidatos) {
      const validado = lancarNotaRequestSchema.safeParse(candidato);
      if (validado.success) {
        pendentes.push(validado.data);
      } else {
        errosPorAluno[candidato.alunoId] = validado.error.issues[0]?.message ?? 'Nota inválida';
      }
    }
    if (Object.keys(errosPorAluno).length > 0) {
      setErros(errosPorAluno);
      return;
    }

    setSalvando(true);
    try {
      await Promise.all(pendentes.map((nota) => lancarNota(nota)));
      router.refresh();
    } catch {
      setErros({ _root: 'Não foi possível salvar as notas. Tente novamente.' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        {erros._root && <p className="mr-auto text-sm text-[var(--color-danger)]">{erros._root}</p>}
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
                      onChange={(evento) => {
                        setValores((atual) => ({ ...atual, [linha.alunoId]: evento.target.value }));
                        setErros((atual) => {
                          if (!(linha.alunoId in atual)) return atual;
                          const { [linha.alunoId]: _removido, ...resto } = atual;
                          return resto;
                        });
                      }}
                      aria-invalid={Boolean(erros[linha.alunoId])}
                      className={`rounded-(--radius-card) w-16 border px-2 py-1 text-sm ${
                        erros[linha.alunoId]
                          ? 'border-[var(--color-danger)]'
                          : 'border-[var(--color-border)]'
                      }`}
                    />
                    {erros[linha.alunoId] && (
                      <p className="mt-1 text-xs text-[var(--color-danger)]">
                        {erros[linha.alunoId]}
                      </p>
                    )}
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
