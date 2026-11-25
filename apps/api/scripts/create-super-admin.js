#!/usr/bin/env node
// Cria (ou redefine a senha de) um SUPER_ADMIN num banco já migrado.
//
// Existe porque o `prisma/seed.ts` recusa NODE_ENV=production e semeia contas
// de demonstração com senha fixa — inaceitável num ambiente com URL pública.
// Aqui entra só uma conta, com a senha que quem opera escolher.
//
// Uso (dentro do container, ex.: `fly ssh console -C "node apps/api/scripts/create-super-admin.js <email> <senha> [nome]"`):
//   node apps/api/scripts/create-super-admin.js admin@exemplo.com 'senha-forte-com-12+' 'Nome'
//
// JS puro e não TS de propósito: roda com o `node` da imagem de produção, que
// não tem ts-node no PATH. Usa DATABASE_URL (papel dono, o mesmo da migração).
const { PrismaClient, UserRole } = require('@prisma/client');
const argon2 = require('argon2');

async function main() {
  const [email, senha, nome = 'Super Admin'] = process.argv.slice(2);
  if (!email || !senha) {
    console.error('Uso: create-super-admin.js <email> <senha> [nome]');
    process.exit(1);
  }
  if (senha.length < 12) {
    console.error('A senha precisa ter ao menos 12 caracteres.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await argon2.hash(senha, { type: argon2.argon2id });
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: UserRole.SUPER_ADMIN, isActive: true, deletedAt: null },
      create: { name: nome, email, passwordHash, role: UserRole.SUPER_ADMIN },
    });
    console.log(`SUPER_ADMIN pronto: ${user.email} (id ${user.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
