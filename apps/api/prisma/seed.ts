import { createHash } from 'node:crypto';

import { PeriodoTipo, PresencaStatus, PrismaClient, UserRole } from '@prisma/client';

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

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@arbora.local' },
    update: {},
    create: {
      name: 'Super Admin Arbora',
      email: 'superadmin@arbora.local',
      passwordHash: hashPlaceholder('ArboraDev2026'),
      role: UserRole.SUPER_ADMIN,
    },
  });

  const escola = await prisma.tenant.upsert({
    where: { slug: 'colegio-arbora' },
    update: {},
    create: {
      nome: 'Colégio Arbora',
      slug: 'colegio-arbora',
      plano: 'piloto',
    },
  });

  const adminEscolar = await prisma.user.upsert({
    where: { email: 'admin@colegio-arbora.local' },
    update: {},
    create: {
      name: 'Diretora Marta Souza',
      email: 'admin@colegio-arbora.local',
      passwordHash: hashPlaceholder('ArboraDev2026'),
      role: UserRole.ADMIN_ESCOLAR,
      tenantId: escola.id,
    },
  });

  const professor = await prisma.user.upsert({
    where: { email: 'professor@colegio-arbora.local' },
    update: {},
    create: {
      name: 'Professor João Lima',
      email: 'professor@colegio-arbora.local',
      passwordHash: hashPlaceholder('ArboraDev2026'),
      role: UserRole.PROFESSOR,
      tenantId: escola.id,
    },
  });

  const responsavel = await prisma.user.upsert({
    where: { email: 'responsavel@colegio-arbora.local' },
    update: {},
    create: {
      name: 'Ana Pereira',
      email: 'responsavel@colegio-arbora.local',
      passwordHash: hashPlaceholder('ArboraDev2026'),
      role: UserRole.RESPONSAVEL,
      tenantId: escola.id,
    },
  });

  const turma = await prisma.turma.upsert({
    where: { tenantId_nome_anoLetivo: { tenantId: escola.id, nome: '5º Ano A', anoLetivo: 2026 } },
    update: {},
    create: {
      tenantId: escola.id,
      nome: '5º Ano A',
      serie: '5º Ano',
      anoLetivo: 2026,
    },
  });

  const disciplina = await prisma.disciplina.upsert({
    where: { tenantId_nome: { tenantId: escola.id, nome: 'Matemática' } },
    update: {},
    create: { tenantId: escola.id, nome: 'Matemática' },
  });

  const turmaDisciplina = await prisma.turmaDisciplina.upsert({
    where: { turmaId_disciplinaId: { turmaId: turma.id, disciplinaId: disciplina.id } },
    update: {},
    create: { turmaId: turma.id, disciplinaId: disciplina.id, professorId: professor.id },
  });

  const periodoLetivo = await prisma.periodoLetivo.upsert({
    where: {
      tenantId_anoLetivo_tipo_numero: {
        tenantId: escola.id,
        anoLetivo: 2026,
        tipo: PeriodoTipo.BIMESTRE,
        numero: 1,
      },
    },
    update: {},
    create: {
      tenantId: escola.id,
      anoLetivo: 2026,
      tipo: PeriodoTipo.BIMESTRE,
      numero: 1,
      dataInicio: new Date('2026-02-02'),
      dataFim: new Date('2026-04-10'),
    },
  });

  const aluno = await prisma.aluno.upsert({
    where: { tenantId_matricula: { tenantId: escola.id, matricula: '2026-0001' } },
    update: {},
    create: {
      tenantId: escola.id,
      nome: 'Pedro Pereira',
      dataNascimento: new Date('2016-03-15'),
      matricula: '2026-0001',
      turmaId: turma.id,
    },
  });

  await prisma.alunoResponsavel.upsert({
    where: { alunoId_responsavelId: { alunoId: aluno.id, responsavelId: responsavel.id } },
    update: {},
    create: { alunoId: aluno.id, responsavelId: responsavel.id, parentesco: 'mãe' },
  });

  await prisma.nota.upsert({
    where: {
      alunoId_turmaDisciplinaId_periodoLetivoId: {
        alunoId: aluno.id,
        turmaDisciplinaId: turmaDisciplina.id,
        periodoLetivoId: periodoLetivo.id,
      },
    },
    update: {},
    create: {
      alunoId: aluno.id,
      turmaDisciplinaId: turmaDisciplina.id,
      periodoLetivoId: periodoLetivo.id,
      valor: 8.5,
      lancadoPorId: professor.id,
    },
  });

  await prisma.presenca.upsert({
    where: {
      alunoId_data_turmaDisciplinaId: {
        alunoId: aluno.id,
        data: new Date('2026-02-10'),
        turmaDisciplinaId: turmaDisciplina.id,
      },
    },
    update: {},
    create: {
      alunoId: aluno.id,
      data: new Date('2026-02-10'),
      turmaDisciplinaId: turmaDisciplina.id,
      status: PresencaStatus.PRESENTE,
      registradoPorId: professor.id,
    },
  });

  console.warn(
    `Seed concluído. Super-admin: ${superAdmin.email} | Escola: ${escola.slug} | Admin: ${adminEscolar.email}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Falha ao executar o seed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
