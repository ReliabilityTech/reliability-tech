import {
  EventoTipo,
  PeriodoTipo,
  PresencaStatus,
  PrismaClient,
  RecadoDestinatario,
  UserRole,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

function hashSenha(senha: string): Promise<string> {
  return argon2.hash(senha, { type: argon2.argon2id });
}

/** Últimos `quantidade` dias úteis (seg-sex), mais recente por último — pra frequência bater com "hoje" de verdade. */
function diasUteisRecentes(quantidade: number): Date[] {
  const dias: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (dias.length < quantidade) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) dias.unshift(new Date(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return dias;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed não deve ser executado em produção.');
  }

  const passwordHash = await hashSenha('ArboraDev2026');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@arbora.local' },
    update: { passwordHash },
    create: {
      name: 'Super Admin Arbora',
      email: 'superadmin@arbora.local',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  const escola = await prisma.tenant.upsert({
    where: { slug: 'colegio-arbora' },
    update: {},
    create: { nome: 'Colégio Arbora', slug: 'colegio-arbora', plano: 'piloto' },
  });

  await prisma.tenant.upsert({
    where: { slug: 'escola-horizonte' },
    update: {},
    create: {
      nome: 'Escola Horizonte',
      slug: 'escola-horizonte',
      plano: 'standard',
      status: 'SUSPENSO',
    },
  });

  const adminEscolar = await prisma.user.upsert({
    where: { email: 'admin@colegio-arbora.local' },
    update: { passwordHash },
    create: {
      name: 'Diretora Marta Souza',
      email: 'admin@colegio-arbora.local',
      passwordHash,
      role: UserRole.ADMIN_ESCOLAR,
      tenantId: escola.id,
    },
  });

  const professor = await prisma.user.upsert({
    where: { email: 'professor@colegio-arbora.local' },
    update: { passwordHash },
    create: {
      name: 'Professor João Lima',
      email: 'professor@colegio-arbora.local',
      passwordHash,
      role: UserRole.PROFESSOR,
      tenantId: escola.id,
    },
  });

  const responsavel1 = await prisma.user.upsert({
    where: { email: 'responsavel@colegio-arbora.local' },
    update: { passwordHash },
    create: {
      name: 'Ana Pereira',
      email: 'responsavel@colegio-arbora.local',
      passwordHash,
      role: UserRole.RESPONSAVEL,
      tenantId: escola.id,
    },
  });

  const responsavel2 = await prisma.user.upsert({
    where: { email: 'carlos.pereira@colegio-arbora.local' },
    update: { passwordHash },
    create: {
      name: 'Carlos Pereira',
      email: 'carlos.pereira@colegio-arbora.local',
      passwordHash,
      role: UserRole.RESPONSAVEL,
      tenantId: escola.id,
    },
  });

  const turma = await prisma.turma.upsert({
    where: { tenantId_nome_anoLetivo: { tenantId: escola.id, nome: '5º Ano A', anoLetivo: 2026 } },
    update: {},
    create: { tenantId: escola.id, nome: '5º Ano A', serie: '5º Ano', anoLetivo: 2026 },
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

  const periodo1 = await prisma.periodoLetivo.upsert({
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

  await prisma.periodoLetivo.upsert({
    where: {
      tenantId_anoLetivo_tipo_numero: {
        tenantId: escola.id,
        anoLetivo: 2026,
        tipo: PeriodoTipo.BIMESTRE,
        numero: 3,
      },
    },
    update: {},
    create: {
      tenantId: escola.id,
      anoLetivo: 2026,
      tipo: PeriodoTipo.BIMESTRE,
      numero: 3,
      dataInicio: new Date('2026-08-01'),
      dataFim: new Date('2026-10-10'),
    },
  });

  const alunosSeed = [
    { matricula: '2026-0001', nome: 'Pedro Pereira', nascimento: '2016-03-15', notaP1: 8.5 },
    { matricula: '2026-0002', nome: 'Ana Costa', nascimento: '2016-06-22', notaP1: 5.5 },
    { matricula: '2026-0003', nome: 'Lucas Andrade', nascimento: '2016-01-09', notaP1: 9.0 },
  ];

  const alunos = await Promise.all(
    alunosSeed.map((dados) =>
      prisma.aluno.upsert({
        where: { tenantId_matricula: { tenantId: escola.id, matricula: dados.matricula } },
        update: {},
        create: {
          tenantId: escola.id,
          nome: dados.nome,
          dataNascimento: new Date(dados.nascimento),
          matricula: dados.matricula,
          turmaId: turma.id,
        },
      }),
    ),
  );
  const [pedro, ana, lucas] = alunos;
  if (!pedro || !ana || !lucas) throw new Error('Seed de alunos incompleto');

  await prisma.alunoResponsavel.upsert({
    where: { alunoId_responsavelId: { alunoId: pedro.id, responsavelId: responsavel1.id } },
    update: {},
    create: {
      alunoId: pedro.id,
      responsavelId: responsavel1.id,
      parentesco: 'mãe',
      podeRetirar: true,
    },
  });
  await prisma.alunoResponsavel.upsert({
    where: { alunoId_responsavelId: { alunoId: pedro.id, responsavelId: responsavel2.id } },
    update: {},
    create: {
      alunoId: pedro.id,
      responsavelId: responsavel2.id,
      parentesco: 'pai',
      podeRetirar: false,
    },
  });
  await prisma.alunoResponsavel.upsert({
    where: { alunoId_responsavelId: { alunoId: ana.id, responsavelId: responsavel2.id } },
    update: {},
    create: {
      alunoId: ana.id,
      responsavelId: responsavel2.id,
      parentesco: 'pai',
      podeRetirar: true,
    },
  });

  // Notas do 1º bimestre — histórico.
  for (const dados of alunosSeed) {
    const aluno = alunos[alunosSeed.indexOf(dados)];
    if (!aluno) continue;
    await prisma.nota.upsert({
      where: {
        alunoId_turmaDisciplinaId_periodoLetivoId: {
          alunoId: aluno.id,
          turmaDisciplinaId: turmaDisciplina.id,
          periodoLetivoId: periodo1.id,
        },
      },
      update: {},
      create: {
        alunoId: aluno.id,
        turmaDisciplinaId: turmaDisciplina.id,
        periodoLetivoId: periodo1.id,
        valor: dados.notaP1,
        lancadoPorId: professor.id,
      },
    });
  }

  // Presença nos últimos dias úteis — Pedro quase sempre presente, Ana mista, Lucas com frequência baixa.
  const dias = diasUteisRecentes(12);
  const faltasPorAluno = new Map([
    [pedro.id, new Set([0])],
    [ana.id, new Set([1, 4, 7])],
    [lucas.id, new Set([0, 1, 2, 5, 8, 9])],
  ]);
  for (const aluno of alunos) {
    const faltas = faltasPorAluno.get(aluno.id) ?? new Set<number>();
    for (const [indice, dia] of dias.entries()) {
      await prisma.presenca.upsert({
        where: {
          alunoId_data_turmaDisciplinaId: {
            alunoId: aluno.id,
            data: dia,
            turmaDisciplinaId: turmaDisciplina.id,
          },
        },
        update: {},
        create: {
          alunoId: aluno.id,
          data: dia,
          turmaDisciplinaId: turmaDisciplina.id,
          status: faltas.has(indice) ? PresencaStatus.FALTA : PresencaStatus.PRESENTE,
          registradoPorId: professor.id,
        },
      });
    }
  }

  await prisma.ocorrencia.create({
    data: {
      alunoId: lucas.id,
      tipo: 'DISCIPLINAR',
      descricao: 'Conversa em sala durante a explicação — advertência verbal.',
      registradoPorId: professor.id,
    },
  });

  await prisma.movimentacao.createMany({
    data: [
      { alunoId: pedro.id, tipo: 'ENTRADA', registradoPorId: adminEscolar.id },
      { alunoId: pedro.id, tipo: 'SAIDA', registradoPorId: adminEscolar.id },
    ],
  });

  const recadoGeral = await prisma.recado.create({
    data: {
      tenantId: escola.id,
      titulo: 'Reunião de Pais - 1º Bimestre',
      corpo: 'Convidamos todos os responsáveis para a reunião de entrega de boletins.',
      destinatario: RecadoDestinatario.TODA_INSTITUICAO,
      autorId: adminEscolar.id,
    },
  });
  await prisma.recadoConfirmacaoLeitura.create({
    data: { recadoId: recadoGeral.id, responsavelId: responsavel1.id },
  });

  await prisma.recado.create({
    data: {
      tenantId: escola.id,
      titulo: 'Lista de materiais complementares',
      corpo: 'Segue a lista de materiais para o próximo projeto de ciências.',
      destinatario: RecadoDestinatario.TURMA,
      turmaId: turma.id,
      autorId: professor.id,
    },
  });

  const hoje = new Date();
  const evento = (dia: number, tipo: EventoTipo, titulo: string, turmaId: string | null) => {
    const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dia);
    return prisma.evento.create({
      data: { tenantId: escola.id, titulo, tipo, dataInicio: data, turmaId },
    });
  };
  await Promise.all([
    evento(3, EventoTipo.PROVA, 'Prova de Matemática — 3º Bimestre', turma.id),
    evento(7, EventoTipo.REUNIAO, 'Conselho de Classe', null),
    evento(14, EventoTipo.EVENTO, 'Feira de Ciências', null),
  ]);

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
