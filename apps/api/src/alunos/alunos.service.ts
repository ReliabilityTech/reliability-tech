import {
  type AlunoListItem,
  type AlunoPerfil,
  type AlunoPerfilEvento,
  type CriarAlunoRequest,
} from '@arbora/contracts';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const JANELA_FREQUENCIA_DIAS = 30;

@Injectable()
export class AlunosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(tenantId: string): Promise<AlunoListItem[]> {
    const alunos = await this.prisma.aluno.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        turma: true,
        responsaveis: { include: { responsavel: true } },
      },
      orderBy: { nome: 'asc' },
    });

    const frequenciaPorAluno = await this.calcularFrequencia(
      tenantId,
      alunos.map((aluno) => aluno.id),
    );

    return alunos.map((aluno) => ({
      id: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      turmaNome: aluno.turma?.nome ?? null,
      responsaveis:
        aluno.responsaveis
          .map((vinculo) => `${vinculo.responsavel.name} (${vinculo.parentesco})`)
          .join(', ') || '—',
      frequencia: frequenciaPorAluno.get(aluno.id) ?? null,
      status: aluno.status,
    }));
  }

  async criar(tenantId: string, dados: CriarAlunoRequest): Promise<{ id: string }> {
    if (dados.turmaId) {
      // Sem isso, um turmaId de outro tenant estouraria como violação crua de
      // FK do Postgres em vez de uma mensagem clara — e um teste de
      // integração (não um unitário com Prisma mockado) é o que pegaria essa
      // omissão de verdade.
      const turma = await this.prisma.turma.findFirst({
        where: { id: dados.turmaId, tenantId },
      });
      if (!turma) throw new BadRequestException('Turma não encontrada nesta instituição');
    }

    try {
      const aluno = await this.prisma.aluno.create({
        data: {
          tenantId,
          nome: dados.nome,
          dataNascimento: new Date(dados.dataNascimento),
          matricula: dados.matricula,
          turmaId: dados.turmaId ?? null,
        },
      });
      return { id: aluno.id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um aluno com essa matrícula');
      }
      throw error;
    }
  }

  async perfil(tenantId: string, alunoId: string): Promise<AlunoPerfil> {
    const aluno = await this.prisma.aluno.findFirst({
      where: { id: alunoId, tenantId, deletedAt: null },
      include: {
        turma: true,
        responsaveis: { include: { responsavel: true } },
        ocorrencias: { orderBy: { dataHora: 'desc' }, take: 3 },
      },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    const [mediaAgregada, frequenciaPorAluno, notasRecentes, movimentacoesRecentes] =
      await Promise.all([
        this.prisma.nota.aggregate({ where: { alunoId }, _avg: { valor: true } }),
        this.calcularFrequencia(tenantId, [alunoId]),
        this.prisma.nota.findMany({
          where: { alunoId },
          include: { turmaDisciplina: { include: { disciplina: true } } },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        this.prisma.movimentacao.findMany({
          where: { alunoId },
          orderBy: { dataHora: 'desc' },
          take: 3,
        }),
      ]);

    const eventosRecentes: AlunoPerfilEvento[] = [
      ...notasRecentes.map((nota) => ({
        quando: nota.createdAt.toISOString(),
        descricao: `Nota lançada em ${nota.turmaDisciplina.disciplina.nome}`,
      })),
      ...movimentacoesRecentes.map((mov) => ({
        quando: mov.dataHora.toISOString(),
        descricao: mov.tipo === 'ENTRADA' ? 'Entrada registrada' : 'Saída registrada',
      })),
    ]
      .sort((a, b) => b.quando.localeCompare(a.quando))
      .slice(0, 5);

    return {
      id: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      turmaNome: aluno.turma?.nome ?? null,
      mediaGeral: mediaAgregada._avg.valor ? Number(mediaAgregada._avg.valor) : null,
      frequencia: frequenciaPorAluno.get(alunoId) ?? null,
      responsaveis: aluno.responsaveis.map((vinculo) => ({
        id: vinculo.responsavel.id,
        nome: vinculo.responsavel.name,
        email: vinculo.responsavel.email,
        parentesco: vinculo.parentesco,
        podeRetirar: vinculo.podeRetirar,
      })),
      alertas: aluno.ocorrencias.map((ocorrencia) => ({
        titulo: ocorrencia.tipo === 'SAUDE' ? 'Ocorrência de saúde' : 'Ocorrência disciplinar',
        descricao: ocorrencia.descricao,
      })),
      eventosRecentes,
    };
  }

  /** Percentual de presença nos últimos 30 dias, por aluno. Ausente do mapa = sem registro. */
  async calcularFrequencia(tenantId: string, alunoIds: string[]): Promise<Map<string, number>> {
    if (alunoIds.length === 0) return new Map();

    const desde = new Date();
    desde.setDate(desde.getDate() - JANELA_FREQUENCIA_DIAS);

    const presencas = await this.prisma.presenca.findMany({
      where: { alunoId: { in: alunoIds }, data: { gte: desde }, aluno: { tenantId } },
      select: { alunoId: true, status: true },
    });

    const contagem = new Map<string, { presentes: number; total: number }>();
    for (const presenca of presencas) {
      const atual = contagem.get(presenca.alunoId) ?? { presentes: 0, total: 0 };
      atual.total += 1;
      if (presenca.status === 'PRESENTE') atual.presentes += 1;
      contagem.set(presenca.alunoId, atual);
    }

    const resultado = new Map<string, number>();
    for (const [alunoId, { presentes, total }] of contagem) {
      resultado.set(alunoId, Math.round((presentes / total) * 100));
    }
    return resultado;
  }
}
