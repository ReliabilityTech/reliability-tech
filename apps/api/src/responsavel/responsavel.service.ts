import { type MovimentacaoItem, type ResponsavelAlunoResumo } from '@arbora/contracts';
import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResponsavelService {
  constructor(private readonly prisma: PrismaService) {}

  async listarAlunos(tenantId: string, responsavelId: string): Promise<ResponsavelAlunoResumo[]> {
    const vinculos = await this.prisma.alunoResponsavel.findMany({
      where: { responsavelId, aluno: { tenantId, deletedAt: null } },
      include: { aluno: true },
      orderBy: { aluno: { nome: 'asc' } },
    });

    return vinculos.map((vinculo) => ({ id: vinculo.aluno.id, nome: vinculo.aluno.nome }));
  }

  async listarMovimentacoes(
    tenantId: string,
    responsavelId: string,
    alunoId: string,
  ): Promise<MovimentacaoItem[]> {
    const vinculo = await this.prisma.alunoResponsavel.findFirst({
      where: { responsavelId, alunoId, aluno: { tenantId } },
    });
    if (!vinculo) {
      throw new ForbiddenException('Este aluno não está vinculado ao responsável logado');
    }

    const movimentacoes = await this.prisma.movimentacao.findMany({
      where: { alunoId },
      orderBy: { dataHora: 'desc' },
      take: 5,
    });

    return movimentacoes.map((mov) => ({
      id: mov.id,
      tipo: mov.tipo,
      quando: mov.dataHora.toISOString(),
    }));
  }
}
