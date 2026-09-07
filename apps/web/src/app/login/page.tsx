'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, Suspense, useState } from 'react';

import { ApiRequestError } from '@/lib/api-client';
import { login } from '@/lib/auth';
import { env } from '@/lib/env';

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
  const [rememberMe, setRememberMe] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      await login(email, password, rememberMe);
      router.push(searchParams.get('from') ?? '/');
      router.refresh();
    } catch (error) {
      setErro(error instanceof ApiRequestError ? error.message : 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Painel de marca — visível a partir de telas grandes, como no protótipo.
          min-h-dvh de novo aqui: numa grid, uma única row `auto` não estica
          para preencher o container mesmo com o container em min-h-dvh. */}
      <div className="hidden min-h-dvh flex-col justify-between bg-[var(--color-brand-600)] p-10 text-white lg:flex">
        <span className="text-lg font-bold tracking-tight">{env.NEXT_PUBLIC_APP_NAME}</span>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Escola e família mais próximas.</h2>
          <p className="mt-3 max-w-sm text-[var(--color-brand-100)]">
            Notas, frequência, recados e agenda em um só lugar, com um perfil dedicado para cada
            pessoa da comunidade escolar.
          </p>
        </div>
        <span className="text-sm text-[var(--color-brand-100)]">Powered by Reliability Tech</span>
      </div>

      <div className="flex min-h-dvh flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="mb-1 text-2xl font-bold tracking-tight">Acesse sua conta</h1>
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)]"
                />
                Lembrar de mim
              </label>
              <Link href="/recuperar-senha" className="font-medium text-[var(--color-link)]">
                Esqueceu sua senha?
              </Link>
            </div>

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

          <p className="mt-6 text-center text-sm text-[var(--color-foreground-muted)]">
            Ainda não tem acesso? Fale com a secretaria da sua escola.
          </p>
        </div>
      </div>
    </main>
  );
}
