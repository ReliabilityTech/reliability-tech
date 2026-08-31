import { type CriarEventoRequest, type EventoCalendario } from '@arbora/contracts';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(tenantId: string): Promise<EventoCalendario[]> {
    const eventos = await this.prisma.evento.findMany({
      where: { tenantId, deletedAt: null },
      include: { turma: true },
      orderBy: { dataInicio: 'asc' },
      take: 200,
    });

    return eventos.map((evento) => ({
      id: evento.id,
      titulo: evento.titulo,
      tipo: evento.tipo,
      dataInicio: evento.dataInicio.toISOString(),
      dataFim: evento.dataFim?.toISOString() ?? null,
      turmaNome: evento.turma?.nome ?? null,
    }));
  }

  async criar(tenantId: string, body: CriarEventoRequest): Promise<{ id: string }> {
    const evento = await this.prisma.evento.create({
      data: {
        tenantId,
        titulo: body.titulo,
        descricao: body.descricao ?? null,
        tipo: body.tipo,
        dataInicio: new Date(body.dataInicio),
        dataFim: body.dataFim ? new Date(body.dataFim) : null,
        turmaId: body.turmaId ?? null,
      },
    });
    return { id: evento.id };
  }
}
