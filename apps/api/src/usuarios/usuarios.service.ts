import { type ProfessorListItem, type RegisterRequest } from '@arbora/contracts';
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async listarProfessores(tenantId: string): Promise<ProfessorListItem[]> {
    const professores = await this.prisma.user.findMany({
      where: { tenantId, role: UserRole.PROFESSOR, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return professores.map((professor) => ({
      id: professor.id,
      name: professor.name,
      email: professor.email,
      createdAt: professor.createdAt.toISOString(),
    }));
  }

  async criarProfessor(tenantId: string, dados: RegisterRequest): Promise<{ id: string }> {
    const passwordHash = await this.passwordService.hash(dados.password);
    try {
      const professor = await this.prisma.user.create({
        data: {
          tenantId,
          name: dados.name,
          email: dados.email,
          passwordHash,
          role: UserRole.PROFESSOR,
        },
      });
      return { id: professor.id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um usuário com esse e-mail');
      }
      throw error;
    }
  }
}
