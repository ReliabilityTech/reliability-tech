'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

type AlunoChamada = { id: string; nome: string; presente: boolean };

const ALUNOS_INICIAL: AlunoChamada[] = [
  { id: '1', nome: 'Alice Machado', presente: true },
  { id: '2', nome: 'Bruno Rocha', presente: true },
  { id: '3', nome: 'Clara Mendes', presente: false },
  { id: '4', nome: 'Daniel Silva', presente: true },
];

export function ChamadaList() {
  const [alunos, setAlunos] = useState<AlunoChamada[]>(ALUNOS_INICIAL);

  function alternarPresenca(id: string): void {
    setAlunos((atual) =>
      atual.map((aluno) => (aluno.id === id ? { ...aluno, presente: !aluno.presente } : aluno)),
    );
  }

  function marcarTodosPresentes(): void {
    setAlunos((atual) => atual.map((aluno) => ({ ...aluno, presente: true })));
  }

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Chamada</h1>
        <p className="text-sm text-[var(--color-foreground-muted)]">Matemática · 5º Ano B · Hoje</p>
      </header>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-foreground-muted)]"
            aria-hidden
          />
          <input
            type="search"
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

      <ul className="rounded-(--radius-card) divide-y divide-[var(--color-border)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        {alunos.map((aluno) => (
          <li key={aluno.id} className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">{aluno.nome}</span>
            <button
              type="button"
              onClick={() => alternarPresenca(aluno.id)}
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
    </div>
  );
}
