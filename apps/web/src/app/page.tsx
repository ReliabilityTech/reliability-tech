import { LogoutButton } from '@/components/logout-button';
import { StatusCard } from '@/components/status-card';
import { env } from '@/lib/env';
import { getServerUser } from '@/lib/server-session';

/**
 * Página inicial provisória: um painel do estado do scaffold. Deve ser
 * substituída pelas telas do protótipo assim que o design for sincronizado.
 */
export default async function HomePage() {
  const user = await getServerUser();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-brand-600)]">
            Reliability Tech
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight">{env.NEXT_PUBLIC_APP_NAME}</h1>
          <p className="mt-3 text-[var(--color-foreground-muted)]">
            Fundação do projeto no ar. Esta tela é temporária e existe para validar que o monorepo,
            o build e os contratos compartilhados estão funcionando de ponta a ponta.
          </p>
        </div>
        {user && (
          <div className="flex shrink-0 flex-col items-end gap-2 text-sm">
            <span>
              {user.name}
              <span className="ml-1 text-[var(--color-foreground-muted)]">({user.role})</span>
            </span>
            <LogoutButton />
          </div>
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatusCard title="Monorepo" tone="ok">
          pnpm workspaces + Turborepo, com lint, typecheck, testes e build unificados.
        </StatusCard>
        <StatusCard title="API" tone="ok">
          NestJS com configuração validada, Prisma, health check, rate limit e OpenAPI.
        </StatusCard>
        <StatusCard title="Contratos" tone="ok">
          Schemas Zod em <code className="font-mono">@arbora/contracts</code>, compartilhados entre
          API e front.
        </StatusCard>
        <StatusCard title="Autenticação" tone="ok">
          Login e refresh via JWT em cookies httpOnly, guards de sessão e de papel, log de auditoria
          em login/logout.
        </StatusCard>
        <StatusCard title="Domínio" tone="ok">
          RF-001 a RF-029 modelados em Prisma e espelhados em{' '}
          <code className="font-mono">@arbora/contracts</code>.
        </StatusCard>
        <StatusCard title="Design system" tone="pendente">
          Cor de marca extraída do protótipo do Stitch. Telas reais e tipografia seguem pendentes.
        </StatusCard>
      </section>

      <footer className="mt-10 text-sm text-[var(--color-foreground-muted)]">
        Próximos passos em <code className="font-mono">docs/roadmap.md</code>.
      </footer>
    </main>
  );
}
