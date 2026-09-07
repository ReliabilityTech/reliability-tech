import {
  type AlunoListItem,
  type AlunoPerfil,
  type AlunoPerfilEvento,
  type CriarAlunoRequest,
  type VincularResponsavelRequest,
} from '@arbora/contracts';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../prisma/prisma.service';

const JANELA_FREQUENCIA_DIAS = 30;

@Injectable()
export class AlunosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async listar(tenantId: string): Promise<AlunoListItem[]> {
    const alunos = await this.prisma.db.aluno.findMany({
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
      const turma = await this.prisma.db.turma.findFirst({
        where: { id: dados.turmaId, tenantId },
      });
      if (!turma) throw new BadRequestException('Turma não encontrada nesta instituição');
    }

    try {
      const aluno = await this.prisma.db.aluno.create({
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
    const aluno = await this.prisma.db.aluno.findFirst({
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
        this.prisma.db.nota.aggregate({ where: { alunoId }, _avg: { valor: true } }),
        this.calcularFrequencia(tenantId, [alunoId]),
        this.prisma.db.nota.findMany({
          where: { alunoId },
          include: { turmaDisciplina: { include: { disciplina: true } } },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        this.prisma.db.movimentacao.findMany({
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

  /**
   * Resolve por e-mail em vez de sempre criar uma conta nova: RF-004 cita
   * explicitamente "pai e mãe separados, ambos com acesso" — a mesma pessoa
   * vai precisar ser vinculada a um segundo filho depois, e criar uma conta
   * por vínculo duplicaria a pessoa real.
   */
  async vincularResponsavel(
    tenantId: string,
    alunoId: string,
    dados: VincularResponsavelRequest,
  ): Promise<{ id: string }> {
    const aluno = await this.prisma.db.aluno.findFirst({ where: { id: alunoId, tenantId } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    // `User.email` é único globalmente (não por tenant) — busca por e-mail
    // sozinho e só depois decide se reaproveita, rejeita (tenant/papel
    // errado) ou cria; um `findFirst({ tenantId, email })` deixaria passar
    // batido um e-mail de outro tenant até estourar cru no `create` abaixo,
    // contra a constraint global.
    const existente = await this.prisma.db.user.findUnique({ where: { email: dados.email } });

    let responsavelId: string;
    if (existente) {
      if (existente.tenantId !== tenantId) {
        throw new BadRequestException('Este e-mail já pertence a uma conta em outra instituição');
      }
      if (existente.role !== UserRole.RESPONSAVEL) {
        throw new BadRequestException('Este e-mail já pertence a outro tipo de conta');
      }
      responsavelId = existente.id;
    } else {
      if (!dados.senha) {
        throw new BadRequestException('Informe uma senha para criar a conta do responsável');
      }
      const passwordHash = await this.passwordService.hash(dados.senha);
      const responsavel = await this.prisma.db.user.create({
        data: {
          tenantId,
          name: dados.nome,
          email: dados.email,
          passwordHash,
          role: UserRole.RESPONSAVEL,
        },
      });
      responsavelId = responsavel.id;
    }

    try {
      const vinculo = await this.prisma.db.alunoResponsavel.create({
        data: {
          alunoId,
          responsavelId,
          parentesco: dados.parentesco,
          podeRetirar: dados.podeRetirar,
        },
      });
      return { id: vinculo.id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Este responsável já está vinculado a este aluno');
      }
      throw error;
    }
  }

  async desvincularResponsavel(
    tenantId: string,
    alunoId: string,
    responsavelId: string,
  ): Promise<void> {
    const { count } = await this.prisma.db.alunoResponsavel.deleteMany({
      where: { alunoId, responsavelId, aluno: { tenantId } },
    });
    if (count === 0) throw new NotFoundException('Vínculo não encontrado');
  }

  /** Percentual de presença nos últimos 30 dias, por aluno. Ausente do mapa = sem registro. */
  async calcularFrequencia(tenantId: string, alunoIds: string[]): Promise<Map<string, number>> {
    if (alunoIds.length === 0) return new Map();

    const desde = new Date();
    desde.setDate(desde.getDate() - JANELA_FREQUENCIA_DIAS);

    const presencas = await this.prisma.db.presenca.findMany({
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
