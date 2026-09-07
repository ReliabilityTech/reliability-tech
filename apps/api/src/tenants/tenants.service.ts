import { type CriarTenantRequest, type TenantListItem, type TenantStatus } from '@arbora/contracts';
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<TenantListItem[]> {
    const tenants = await this.prisma.tenant.findMany({
      include: { _count: { select: { alunos: true } } },
      orderBy: { nome: 'asc' },
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      nome: tenant.nome,
      plano: tenant.plano,
      status: tenant.status,
      totalAlunos: tenant._count.alunos,
      createdAt: tenant.createdAt.toISOString(),
    }));
  }

  async criar(dados: CriarTenantRequest): Promise<{ id: string }> {
    try {
      const tenant = await this.prisma.tenant.create({ data: dados });
      return { id: tenant.id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe uma instituição com esse identificador (slug)');
      }
      throw error;
    }
  }

  async atualizarStatus(tenantId: string, status: TenantStatus): Promise<{ id: string }> {
    const tenant = await this.prisma.tenant.update({ where: { id: tenantId }, data: { status } });
    return { id: tenant.id };
  }

  async resumo(): Promise<{
    instituicoesAtivas: number;
    instituicoesSuspensas: number;
    totalAlunos: number;
  }> {
    const [instituicoesAtivas, instituicoesSuspensas, totalAlunos] = await Promise.all([
      this.prisma.tenant.count({ where: { status: 'ATIVO' } }),
      this.prisma.tenant.count({ where: { status: 'SUSPENSO' } }),
      this.prisma.aluno.count({ where: { deletedAt: null } }),
    ]);
    return { instituicoesAtivas, instituicoesSuspensas, totalAlunos };
  }
}
