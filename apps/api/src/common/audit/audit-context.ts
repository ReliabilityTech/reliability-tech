import { type Request } from 'express';

/**
 * Escape hatch para rotas onde o `AuditInterceptor` não consegue inferir o
 * autor sozinho (ex.: `/auth/logout`, que é `@Public()` e não devolve corpo).
 * O handler chama `setAuditContext` antes de responder.
 */
export type AuditContext = { userId?: string; tenantId?: string };

type RequestWithAuditContext = Request & { auditContext?: AuditContext };

export function setAuditContext(request: Request, patch: AuditContext): void {
  const req = request as RequestWithAuditContext;
  req.auditContext = { ...req.auditContext, ...patch };
}

export function getAuditContext(request: Request): AuditContext | undefined {
  return (request as RequestWithAuditContext).auditContext;
}
