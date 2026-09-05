import { type PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

export const SENHA_FIXTURE = 'FixtureE2E2026!';

/**
 * Cria um tenant com um admin e dois alunos — usado pra montar o cenário de
 * isolamento entre tenants (ADR 0006: sem RLS ainda, a disciplina de
 * `tenantId` no código é a única barreira, e só um teste contra banco real
 * pega uma query que esqueceu o filtro).
 */
export async function criarTenantComFixtures(
  prisma: PrismaClient,
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
