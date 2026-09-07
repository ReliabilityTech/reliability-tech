import { type CriarTurmaRequest, type TurmaListItem } from '@arbora/contracts';
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TurmasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(tenantId: string): Promise<TurmaListItem[]> {
    const turmas = await this.prisma.turma.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { nome: 'asc' },
    });

    return turmas.map((turma) => ({
      id: turma.id,
      nome: turma.nome,
      serie: turma.serie,
      anoLetivo: turma.anoLetivo,
    }));
  }

  async criar(tenantId: string, dados: CriarTurmaRequest): Promise<{ id: string }> {
    try {
      const turma = await this.prisma.turma.create({ data: { tenantId, ...dados } });
      return { id: turma.id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe uma turma com esse nome neste ano letivo');
      }
      throw error;
    }
  }
}
