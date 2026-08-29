'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, Suspense, useState } from 'react';

import { ApiRequestError } from '@/lib/api-client';
import { login } from '@/lib/auth';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

/** `useSearchParams` exige um limite de Suspense — ver LoginPage acima. */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      await login(email, password);
      router.push(searchParams.get('from') ?? '/');
      router.refresh();
    } catch (error) {
      setErro(error instanceof ApiRequestError ? error.message : 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Entrar no Arbora</h1>
      <p className="mb-6 text-sm text-[var(--color-foreground-muted)]">
        Use o e-mail e a senha cadastrados pela sua instituição.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1 text-sm font-medium">
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Senha
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-(--radius-card) border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
        </label>

        {erro && (
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="rounded-(--radius-card) mt-2 bg-[var(--color-brand-600)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {carregando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
