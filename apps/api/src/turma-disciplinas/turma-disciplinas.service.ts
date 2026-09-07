import { type CriarTurmaDisciplinaRequest } from '@arbora/contracts';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TurmaDisciplinasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upsert por [turmaId, disciplinaId] em vez de só criar: cobre tanto
   * "atribuir pela primeira vez" quanto "trocar quem dá essa disciplina
   * nessa turma" sem precisar de um segundo endpoint de edição.
   */
  async atribuir(tenantId: string, dados: CriarTurmaDisciplinaRequest): Promise<{ id: string }> {
    const [turma, disciplina, professor] = await Promise.all([
      this.prisma.db.turma.findFirst({ where: { id: dados.turmaId, tenantId } }),
      this.prisma.db.disciplina.findFirst({ where: { id: dados.disciplinaId, tenantId } }),
      this.prisma.db.user.findFirst({
        where: { id: dados.professorId, tenantId, role: UserRole.PROFESSOR },
      }),
    ]);

    if (!turma) throw new BadRequestException('Turma não encontrada nesta instituição');
    if (!disciplina) throw new BadRequestException('Disciplina não encontrada nesta instituição');
    if (!professor) throw new BadRequestException('Professor não encontrado nesta instituição');

    const turmaDisciplina = await this.prisma.db.turmaDisciplina.upsert({
      where: { turmaId_disciplinaId: { turmaId: dados.turmaId, disciplinaId: dados.disciplinaId } },
      update: { professorId: dados.professorId },
      create: {
        turmaId: dados.turmaId,
        disciplinaId: dados.disciplinaId,
        professorId: dados.professorId,
      },
    });

    return { id: turmaDisciplina.id };
  }
}
