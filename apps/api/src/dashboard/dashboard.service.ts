import {
  type DashboardAdminResponse,
  type DashboardProfessorResponse,
  type DashboardSuperAdminResponse,
} from '@arbora/contracts';
import { Injectable } from '@nestjs/common';

import { AlunosService } from '../alunos/alunos.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfessorService } from '../professor/professor.service';
import { TenantsService } from '../tenants/tenants.service';

const LIMIAR_ATENCAO_FREQUENCIA = 80;

const ACAO_LABEL: Record<string, string> = {
  LOGIN: 'Login realizado',
  LOGOUT: 'Logout realizado',
  NOTA_LANCADA: 'Nota lançada',
  PRESENCA_REGISTRADA: 'Presença registrada',
  RECADO_PUBLICADO: 'Novo comunicado publicado',
  EVENTO_CRIADO: 'Novo evento na agenda',
  TENANT_STATUS_ALTERADO: 'Status de instituição alterado',
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alunosService: AlunosService,
    private readonly professorService: ProfessorService,
    private readonly tenantsService: TenantsService,
  ) {}

  async admin(tenantId: string): Promise<DashboardAdminResponse> {
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const [alunos, faltasHoje, comunicadosRecentes, auditoria] = await Promise.all([
      this.prisma.aluno.findMany({
        where: { tenantId, status: 'ATIVO', deletedAt: null },
        include: { turma: true },
      }),
      this.prisma.presenca.count({
        where: { status: 'FALTA', data: { gte: inicioHoje }, aluno: { tenantId } },
      }),
      this.prisma.recado.count({
        where: { tenantId, publicadoEm: { gte: seteDiasAtras }, deletedAt: null },
      }),
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const frequenciaPorAluno = await this.alunosService.calcularFrequencia(
      tenantId,
      alunos.map((aluno) => aluno.id),
    );

    const comFrequencia = alunos
      .map((aluno) => ({ aluno, frequencia: frequenciaPorAluno.get(aluno.id) }))
      .filter(
        (item): item is { aluno: (typeof alunos)[number]; frequencia: number } =>
          item.frequencia !== undefined && item.frequencia < LIMIAR_ATENCAO_FREQUENCIA,
      )
      .sort((a, b) => a.frequencia - b.frequencia)
      .slice(0, 5);

    const todasFrequencias = [...frequenciaPorAluno.values()];
    const frequenciaMedia =
      todasFrequencias.length > 0
        ? Math.round(
            todasFrequencias.reduce((soma, valor) => soma + valor, 0) / todasFrequencias.length,
          )
        : null;

    return {
      totalAlunos: alunos.length,
      frequenciaMedia,
      faltasHoje,
      comunicadosRecentes,
      atencaoNecessaria: comFrequencia.map(({ aluno, frequencia }) => ({
        alunoId: aluno.id,
        nome: aluno.nome,
        turmaNome: aluno.turma?.nome ?? null,
        frequencia,
      })),
      atividadesRecentes: auditoria.map((entrada) => ({
        descricao: ACAO_LABEL[entrada.action] ?? entrada.action,
        quando: entrada.createdAt.toISOString(),
      })),
    };
  }

  async professor(tenantId: string, professorId: string): Promise<DashboardProfessorResponse> {
    return { turmasDisciplinas: await this.professorService.listarTurmas(tenantId, professorId) };
  }

  superAdmin(): Promise<DashboardSuperAdminResponse> {
    return this.tenantsService.resumo();
  }
}
