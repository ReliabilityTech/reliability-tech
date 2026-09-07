'use client';

import { criarTenantRequestSchema } from '@arbora/contracts';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';

import { primeiroErroPorCampo } from '@/lib/form-errors';
import { criarTenant } from '@/lib/tenants-client';

export function NovaInstituicaoDialog() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [plano, setPlano] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  function limparEAbrir(): void {
    setNome('');
    setSlug('');
    setPlano('');
    setErros({});
    dialogRef.current?.showModal();
  }

  async function handleSubmit(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setErros({});

    const validado = criarTenantRequestSchema.safeParse({ nome, slug, plano });
    if (!validado.success) {
      setErros(primeiroErroPorCampo(validado.error.issues));
      return;
    }

    setEnviando(true);
    try {
      await criarTenant(validado.data);
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setErros({ _root: 'Não foi possível cadastrar a instituição. Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={limparEAbrir}
        className="rounded-(--radius-card) flex items-center gap-2 bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Nova instituição
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-(--radius-card) w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0 backdrop:bg-black/40"
      >
        <form onSubmit={(evento) => void handleSubmit(evento)} className="flex flex-col gap-3 p-5">
          <h2 className="text-lg font-semibold">Nova instituição</h2>

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
            Identificador (slug)
            <input
              required
              value={slug}
              onChange={(evento) => setSlug(evento.target.value)}
              placeholder="colegio-exemplo"
              aria-invalid={Boolean(erros.slug)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.slug ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              }`}
            />
            {erros.slug && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.slug}
              </p>
            )}
          </label>

          <label className="text-sm font-medium">
            Plano
            <input
              required
              value={plano}
              onChange={(evento) => setPlano(evento.target.value)}
              placeholder="piloto"
              aria-invalid={Boolean(erros.plano)}
              className={`rounded-(--radius-card) mt-1 w-full border px-3 py-2 text-sm font-normal ${
                erros.plano ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              }`}
            />
            {erros.plano && (
              <p role="alert" className="mt-1 text-xs font-normal text-[var(--color-danger)]">
                {erros.plano}
              </p>
            )}
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
              {enviando ? 'Cadastrando…' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
