import { Injectable, Logger } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export type AuditEntry = {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  tenantId?: string;
  ip?: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Nunca deixa uma falha de auditoria derrubar a requisição principal —
   * registra o erro e segue. Perder uma linha de audit log é ruim; derrubar
   * um login por causa dela seria pior.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          userId: entry.userId,
          tenantId: entry.tenantId,
          ip: entry.ip,
          metadata: entry.metadata,
        },
      });
    } catch (error) {
      this.logger.error(
        `Falha ao gravar audit log (${entry.action} ${entry.entity})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
