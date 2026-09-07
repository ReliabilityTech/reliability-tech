import { type CriarRecadoRequest, type RecadoListItem } from '@arbora/contracts';
import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecadosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(tenantId: string): Promise<RecadoListItem[]> {
    const recados = await this.prisma.recado.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        autor: true,
        turma: true,
        aluno: true,
        _count: { select: { confirmacoesLeitura: true } },
      },
      orderBy: { publicadoEm: 'desc' },
      take: 50,
    });

    return Promise.all(
      recados.map(async (recado) => {
        const totalDestinatarios = await this.contarDestinatarios(tenantId, recado);
        return {
          id: recado.id,
          titulo: recado.titulo,
          destinatarioLabel: this.destinatarioLabel(recado),
          autorNome: recado.autor.name,
          publicadoEm: recado.publicadoEm.toISOString(),
          leituraPercentual:
            totalDestinatarios > 0
              ? Math.round((recado._count.confirmacoesLeitura / totalDestinatarios) * 100)
              : null,
        };
      }),
    );
  }

  async criar(
    tenantId: string,
    autorId: string,
    body: CriarRecadoRequest,
  ): Promise<{ id: string }> {
    if (body.destinatario === 'TURMA' && !body.turmaId) {
      throw new BadRequestException('turmaId é obrigatório quando destinatario é TURMA');
    }
    if (body.destinatario === 'INDIVIDUAL' && !body.alunoId) {
      throw new BadRequestException('alunoId é obrigatório quando destinatario é INDIVIDUAL');
    }

    const recado = await this.prisma.recado.create({
      data: {
        tenantId,
        autorId,
        titulo: body.titulo,
        corpo: body.corpo,
        destinatario: body.destinatario,
        turmaId: body.destinatario === 'TURMA' ? body.turmaId : null,
        alunoId: body.destinatario === 'INDIVIDUAL' ? body.alunoId : null,
      },
    });
    return { id: recado.id };
  }

  private destinatarioLabel(recado: {
    destinatario: string;
    turma: { nome: string } | null;
    aluno: { nome: string } | null;
  }): string {
    switch (recado.destinatario) {
      case 'TURMA':
        return recado.turma ? `Turma ${recado.turma.nome}` : 'Turma';
      case 'INDIVIDUAL':
        return recado.aluno ? `Aluno: ${recado.aluno.nome}` : 'Aluno';
      default:
        return 'Toda a instituição';
    }
  }

  private async contarDestinatarios(
    tenantId: string,
    recado: { destinatario: string; turmaId: string | null; alunoId: string | null },
  ): Promise<number> {
    if (recado.destinatario === 'INDIVIDUAL' && recado.alunoId) {
      return this.prisma.alunoResponsavel.count({ where: { alunoId: recado.alunoId } });
    }
    if (recado.destinatario === 'TURMA' && recado.turmaId) {
      return this.prisma.alunoResponsavel.count({
        where: { aluno: { turmaId: recado.turmaId } },
      });
    }
    return this.prisma.user.count({ where: { tenantId, role: 'RESPONSAVEL', deletedAt: null } });
  }
}
