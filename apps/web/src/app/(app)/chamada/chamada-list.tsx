'use client';

import { type PresencaItem, type TurmaDisciplinaResumo } from '@arbora/contracts';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { registrarPresencas } from '@/lib/professor-client';

import { FiltrosChamada } from './filtros-chamada';

export function ChamadaList({
  turmas,
  turmaDisciplinaId,
  data,
  presencas,
}: {
  turmas: TurmaDisciplinaResumo[];
  turmaDisciplinaId: string;
  data: string;
  presencas: PresencaItem[];
}) {
  const router = useRouter();
  const [alunos, setAlunos] = useState<PresencaItem[]>(presencas);
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function alternarPresenca(alunoId: string): void {
    setAlunos((atual) =>
      atual.map((aluno) =>
        aluno.alunoId === alunoId ? { ...aluno, presente: !aluno.presente } : aluno,
      ),
    );
  }

  function marcarTodosPresentes(): void {
    setAlunos((atual) => atual.map((aluno) => ({ ...aluno, presente: true })));
  }

  async function handleSalvar(): Promise<void> {
    setSalvando(true);
    setErro(null);
    try {
      await registrarPresencas({
        turmaDisciplinaId,
        data,
        registros: alunos.map((aluno) => ({ alunoId: aluno.alunoId, presente: aluno.presente })),
      });
      router.refresh();
    } catch {
      setErro('Não foi possível salvar a chamada. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  const alunosFiltrados = alunos.filter((aluno) =>
    aluno.alunoNome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Chamada</h1>
        <div className="flex items-center gap-2">
          <FiltrosChamada turmas={turmas} turmaDisciplinaId={turmaDisciplinaId} data={data} />
          <button
            type="button"
            onClick={() => void handleSalvar()}
            disabled={salvando}
            className="rounded-(--radius-card) whitespace-nowrap bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar chamada'}
          </button>
        </div>
      </header>
      {erro && <p className="mb-4 text-sm text-[var(--color-danger)]">{erro}</p>}

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-foreground-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar aluno..."
            className="rounded-(--radius-card) w-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={marcarTodosPresentes}
          className="rounded-(--radius-card) whitespace-nowrap bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white"
        >
          Marcar todos como presentes
        </button>
      </div>

      {alunosFiltrados.length === 0 ? (
        <p className="text-sm text-[var(--color-foreground-muted)]">Nenhum aluno encontrado.</p>
      ) : (
        <ul className="rounded-(--radius-card) divide-y divide-[var(--color-border)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          {alunosFiltrados.map((aluno) => (
            <li key={aluno.alunoId} className="flex items-center justify-between px-4 py-3">
              <span className="font-medium">{aluno.alunoNome}</span>
              <button
                type="button"
                onClick={() => alternarPresenca(aluno.alunoId)}
                aria-pressed={aluno.presente}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  aluno.presente
                    ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                    : 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'
                }`}
              >
                {aluno.presente ? 'Presente' : 'Falta'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
