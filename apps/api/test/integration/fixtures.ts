import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

export const SENHA_FIXTURE = 'FixtureE2E2026!';

/**
 * Tipo mínimo escrito à mão em vez de reaproveitar os delegates do
 * `PrismaClient`/`PrismaService['db']` — o client estendido com RLS
 * (`$extends`, roadmap 6.2) tem assinaturas genéricas "marcadas" que não
 * unificam estruturalmente com as do `PrismaClient` puro, mesmo pros mesmos
 * métodos. Aceita ambos (specs que abrem sua própria conexão, ex.:
 * `backup-restore`, e as que usam `app.get(PrismaService).db`) porque só
 * pede a forma exata usada aqui, não o contrato completo de nenhum dos dois.
 */
type PrismaLike = {
  tenant: {
    // Sintaxe de método (não propriedade com tipo de função): checagem de
    // parâmro bivariante do TS, a única forma de um client estendido (com
    // assinatura genérica "marcada") e um `PrismaClient` puro unificarem
    // estruturalmente no mesmo tipo.
    create(args: { data: { nome: string; slug: string; plano: string } }): Promise<{ id: string }>;
  };
  user: { create(args: { data: Record<string, unknown> }): Promise<unknown> };
  aluno: { create(args: { data: Record<string, unknown> }): Promise<unknown> };
};

/**
 * Cria um tenant com um admin e dois alunos — usado pra montar o cenário de
 * isolamento entre tenants (ADR 0006: a disciplina de `tenantId` no código é
 * a primeira barreira; RLS na camada de banco, roadmap 6.2, é a segunda —
 * um teste contra banco real, não um unitário com Prisma mockado, é o que
 * pega uma query que esqueceu o filtro ou uma política RLS mal escrita).
 */
export async function criarTenantComFixtures(
  prisma: PrismaLike,
  opcoes: { slug: string; nomeTenant: string; emailAdmin: string; nomesAlunos: string[] },
): Promise<{ tenantId: string; adminEmail: string }> {
  const passwordHash = await argon2.hash(SENHA_FIXTURE, { type: argon2.argon2id });

  const tenant = await prisma.tenant.create({
    data: { nome: opcoes.nomeTenant, slug: opcoes.slug, plano: 'piloto' },
  });

  await prisma.user.create({
    data: {
      name: `Admin ${opcoes.nomeTenant}`,
      email: opcoes.emailAdmin,
      passwordHash,
      role: UserRole.ADMIN_ESCOLAR,
      tenantId: tenant.id,
    },
  });

  for (const nome of opcoes.nomesAlunos) {
    await prisma.aluno.create({
      data: {
        tenantId: tenant.id,
        nome,
        dataNascimento: new Date('2015-01-01'),
        matricula: `${opcoes.slug}-${nome.replace(/\s+/g, '').toLowerCase()}`,
      },
    });
  }

  return { tenantId: tenant.id, adminEmail: opcoes.emailAdmin };
}
