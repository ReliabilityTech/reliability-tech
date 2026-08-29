import { SetMetadata } from '@nestjs/common';

import { AUDIT_KEY, type AuditMetadata } from './audit.constants';

/**
 * Marca uma rota para gravação automática em `AuditLog` pelo `AuditInterceptor`
 * (RF-029, RNF-004). Só dispara em respostas bem-sucedidas.
 */
export const Audit = (action: string, entity: string): MethodDecorator =>
  SetMetadata<string, AuditMetadata>(AUDIT_KEY, { action, entity });
