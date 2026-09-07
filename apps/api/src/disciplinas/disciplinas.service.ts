import { type CriarDisciplinaRequest, type DisciplinaListItem } from '@arbora/contracts';
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DisciplinasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(tenantId: string): Promise<DisciplinaListItem[]> {
    const disciplinas = await this.prisma.disciplina.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { nome: 'asc' },
    });

    return disciplinas.map((disciplina) => ({ id: disciplina.id, nome: disciplina.nome }));
  }

  async criar(tenantId: string, dados: CriarDisciplinaRequest): Promise<{ id: string }> {
    try {
      const disciplina = await this.prisma.disciplina.create({ data: { tenantId, ...dados } });
      return { id: disciplina.id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe uma disciplina com esse nome');
      }
      throw error;
    }
  }
}
