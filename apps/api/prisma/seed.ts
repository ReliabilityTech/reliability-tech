import { createHash } from 'node:crypto';

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Placeholder de hash. Substituir por argon2/bcrypt junto com a implementação
 * real de autenticação (ver docs/adr/0004-autenticacao-e-papeis.md).
 */
function hashPlaceholder(senha: string): string {
  return `seed$${createHash('sha256').update(senha).digest('hex')}`;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed não deve ser executado em produção.');
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@arbora.local' },
    update: {},
    create: {
      name: 'Administrador Arbora',
      email: 'admin@arbora.local',
      passwordHash: hashPlaceholder('ArboraDev2026'),
      role: UserRole.ADMIN,
    },
  });

  console.warn(`Seed concluído. Usuário admin: ${admin.email}`);
}

main()
  .catch((error: unknown) => {
    console.error('Falha ao executar o seed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
