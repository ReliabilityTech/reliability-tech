import Link from 'next/link';

/**
 * Stub: RF-003 (recuperação de senha por e-mail/SMS) ainda não foi
 * implementado — depende de um provedor de e-mail/SMS ainda não escolhido
 * (ver docs/roadmap.md, dívidas da Fase 2). Existe para o link do login não
 * cair em 404.
 */
export default function RecuperarSenhaPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 text-center">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Recuperação de senha</h1>
      <p className="text-sm text-[var(--color-foreground-muted)]">
        Essa funcionalidade ainda não está disponível. Fale com a secretaria da sua escola para
        redefinir sua senha.
      </p>
      <Link href="/login" className="mt-6 font-medium text-[var(--color-link)]">
        Voltar para o login
      </Link>
    </main>
  );
}
