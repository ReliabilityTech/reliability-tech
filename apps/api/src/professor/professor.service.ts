import {
  type LancarNotaRequest,
  type NotaLancamentoItem,
  type PeriodoLetivoResumo,
  type PresencaItem,
  type RegistrarPresencasRequest,
  type TurmaDisciplinaResumo,
} from '@arbora/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { type TurmaDisciplina } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const NOTA_APROVACAO_MINIMA = 6;

@Injectable()
export class ProfessorService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTurmas(tenantId: string, professorId: string): Promise<TurmaDisciplinaResumo[]> {
    const turmasDisciplinas = await this.prisma.turmaDisciplina.findMany({
      where: { professorId, turma: { tenantId } },
      include: { turma: true, disciplina: true },
      orderBy: [{ turma: { nome: 'asc' } }, { disciplina: { nome: 'asc' } }],
    });

    return turmasDisciplinas.map((td) => ({
      id: td.id,
      turmaId: td.turmaId,
      turmaNome: td.turma.nome,
      disciplinaNome: td.disciplina.nome,
    }));
  }

  async listarPeriodos(tenantId: string): Promise<PeriodoLetivoResumo[]> {
    const periodos = await this.prisma.periodoLetivo.findMany({
      where: { tenantId },
      orderBy: [{ anoLetivo: 'desc' }, { tipo: 'asc' }, { numero: 'asc' }],
      take: 12,
    });
    return periodos.map((p) => ({
      id: p.id,
      anoLetivo: p.anoLetivo,
      tipo: p.tipo,
      numero: p.numero,
    }));
  }

  async listarNotas(
    tenantId: string,
    professorId: string,
    turmaDisciplinaId: string,
    periodoLetivoId: string,
  ): Promise<NotaLancamentoItem[]> {
    const turmaDisciplina = await this.assertTurmaDisciplinaDoProfessor(
      tenantId,
      professorId,
      turmaDisciplinaId,
    );

    const [alunos, notas] = await Promise.all([
      this.prisma.aluno.findMany({
        where: { turmaId: turmaDisciplina.turmaId, deletedAt: null },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.nota.findMany({ where: { turmaDisciplinaId, periodoLetivoId } }),
    ]);

    const notaPorAluno = new Map(notas.map((nota) => [nota.alunoId, nota]));

    return alunos.map((aluno) => {
      const nota = notaPorAluno.get(aluno.id);
      const valor = nota ? Number(nota.valor) : null;
      return {
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        valor,
        situacao:
          valor === null ? 'SEM_NOTA' : valor >= NOTA_APROVACAO_MINIMA ? 'APROVADO' : 'ATENCAO',
      };
    });
  }

  async lancarNota(
    tenantId: string,
    professorId: string,
    body: LancarNotaRequest,
  ): Promise<{ id: string }> {
    await this.assertTurmaDisciplinaDoProfessor(tenantId, professorId, body.turmaDisciplinaId);

    const nota = await this.prisma.nota.upsert({
      where: {
        alunoId_turmaDisciplinaId_periodoLetivoId: {
          alunoId: body.alunoId,
          turmaDisciplinaId: body.turmaDisciplinaId,
          periodoLetivoId: body.periodoLetivoId,
        },
      },
      update: { valor: body.valor },
      create: { ...body, lancadoPorId: professorId },
    });

    return { id: nota.id };
  }

  async listarPresencas(
    tenantId: string,
    professorId: string,
    turmaDisciplinaId: string,
    data: string,
  ): Promise<PresencaItem[]> {
    const turmaDisciplina = await this.assertTurmaDisciplinaDoProfessor(
      tenantId,
      professorId,
      turmaDisciplinaId,
    );

    const [alunos, presencas] = await Promise.all([
      this.prisma.aluno.findMany({
        where: { turmaId: turmaDisciplina.turmaId, deletedAt: null },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.presenca.findMany({
        where: { turmaDisciplinaId, data: new Date(data) },
      }),
    ]);

    const presencaPorAluno = new Map(presencas.map((p) => [p.alunoId, p]));

    return alunos.map((aluno) => ({
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      presente: presencaPorAluno.get(aluno.id)?.status === 'PRESENTE',
    }));
  }

  async registrarPresencas(
    tenantId: string,
    professorId: string,
    body: RegistrarPresencasRequest,
  ): Promise<{ registrados: number }> {
    await this.assertTurmaDisciplinaDoProfessor(tenantId, professorId, body.turmaDisciplinaId);
    const data = new Date(body.data);

    await this.prisma.$transaction(
      body.registros.map((registro) =>
        this.prisma.presenca.upsert({
          where: {
            alunoId_data_turmaDisciplinaId: {
              alunoId: registro.alunoId,
              data,
              turmaDisciplinaId: body.turmaDisciplinaId,
            },
          },
          update: { status: registro.presente ? 'PRESENTE' : 'FALTA' },
          create: {
            alunoId: registro.alunoId,
            data,
            turmaDisciplinaId: body.turmaDisciplinaId,
            status: registro.presente ? 'PRESENTE' : 'FALTA',
            registradoPorId: professorId,
          },
        }),
      ),
    );

    return { registrados: body.registros.length };
  }

  private async assertTurmaDisciplinaDoProfessor(
    tenantId: string,
    professorId: string,
    turmaDisciplinaId: string,
  ): Promise<TurmaDisciplina> {
    const turmaDisciplina = await this.prisma.turmaDisciplina.findFirst({
      where: { id: turmaDisciplinaId, professorId, turma: { tenantId } },
    });
    if (!turmaDisciplina) {
      throw new NotFoundException('Turma/disciplina não encontrada para este professor');
    }
    return turmaDisciplina;
  }
}
