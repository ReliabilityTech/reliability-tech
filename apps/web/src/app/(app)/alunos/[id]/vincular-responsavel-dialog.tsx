'use client';

import { vincularResponsavelRequestSchema } from '@arbora/contracts';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';

import { vincularResponsavel } from '@/lib/alunos-client';
import { primeiroErroPorCampo } from '@/lib/form-errors';

export function VincularResponsavelDialog({ alunoId }: { alunoId: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [podeRetirar, setPodeRetirar] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  function limparEAbrir(): void {
    setNome('');
    setEmail('');
    setSenha('');
    setParentesco('');
    setPodeRetirar(true);
    setErros({});
    dialogRef.current?.showModal();
  }

  async function handleSubmit(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setErros({});

    const validado = vincularResponsavelRequestSchema.safeParse({
      nome,
      email,
      senha: senha || undefined,
      parentesco,
      podeRetirar,
    });
    if (!validado.success) {
      setErros(primeiroErroPorCampo(validado.error.issues));
      return;
    }

    setEnviando(true);
    try {
      await vincularResponsavel(alunoId, validado.data);
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setErros({ _root: 'Não foi possível vincular o responsável. Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={limparEAbrir}
        className="rounded-(--radius-card) flex items-center gap-2 border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Vincular responsável
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-(--radius-card) w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0 backdrop:bg-black/40"
      >
        <form onSubmit={(evento) => void handleSubmit(evento)} className="flex flex-col gap-3 p-5">
          <h2 className="text-lg font-semibold">Vincular responsável</h2>
          <p className="text-sm text-[var(--color-foreground-muted)]">
            Se já existir uma conta de responsável com este e-mail, ela é reaproveitada — sem criar
            uma conta duplicada.
          </p>

          <label className="text-sm font-medium">
            Nome
            <input
              required
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              aria-invalid={Boolean(erros.nome)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.nome ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              }`}
            />
            {erros.nome && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.nome}
              </p>
            )}
          </label>

          <label className="text-sm font-medium">
            E-mail
            <input
              required
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              aria-invalid={Boolean(erros.email)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.email ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              }`}
            />
            {erros.email && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.email}
              </p>
            )}
          </label>

          <label className="text-sm font-medium">
            Senha (obrigatória só se for uma conta nova)
            <input
              type="password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              aria-invalid={Boolean(erros.senha)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.senha ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              }`}
            />
            {erros.senha && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.senha}
              </p>
            )}
          </label>

          <label className="text-sm font-medium">
            Parentesco
            <input
              required
              value={parentesco}
              onChange={(evento) => setParentesco(evento.target.value)}
              placeholder="Mãe, pai, avó…"
              aria-invalid={Boolean(erros.parentesco)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.parentesco ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              }`}
            />
            {erros.parentesco && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.parentesco}
              </p>
            )}
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={podeRetirar}
              onChange={(evento) => setPodeRetirar(evento.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)]"
            />
            Autorizado a retirar o aluno
          </label>

          {erros._root && (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {erros._root}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-(--radius-card) border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-(--radius-card) bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {enviando ? 'Vinculando…' : 'Vincular'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
