import { StatusCard } from '@/components/status-card';
import { env } from '@/lib/env';

/**
 * Página inicial provisória: um painel do estado do scaffold. Deve ser
 * substituída pelas telas do protótipo assim que o design for sincronizado.
 */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-brand-600)]">
          Reliability Tech
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">{env.NEXT_PUBLIC_APP_NAME}</h1>
        <p className="mt-3 text-[var(--color-foreground-muted)]">
          Fundação do projeto no ar. Esta tela é temporária e existe para validar que o monorepo, o
          build e os contratos compartilhados estão funcionando de ponta a ponta.
        </p>
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
        <StatusCard title="Design system" tone="pendente">
          Tokens provisórios. Precisam ser extraídos do protótipo do Stitch.
        </StatusCard>
        <StatusCard title="Requisitos" tone="pendente">
          <code className="font-mono">docs/requisitos/</code> aguarda a importação dos RFs e RNFs do
          Notion.
        </StatusCard>
        <StatusCard title="Domínio" tone="pendente">
          Só o núcleo de identidade está modelado no Prisma. As entidades de negócio dependem dos
          requisitos.
        </StatusCard>
      </section>

      <footer className="mt-10 text-sm text-[var(--color-foreground-muted)]">
        Próximos passos em <code className="font-mono">docs/roadmap.md</code>.
      </footer>
    </main>
  );
}
