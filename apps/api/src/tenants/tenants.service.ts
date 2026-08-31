import { type TenantListItem, type TenantStatus } from '@arbora/contracts';
import { Injectable } from '@nestjs/common';

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
