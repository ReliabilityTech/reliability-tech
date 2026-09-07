import {
  type AtualizarStatusTenantRequest,
  atualizarStatusTenantRequestSchema,
  type CriarTenantRequest,
  criarTenantRequestSchema,
  type TenantListItem,
} from '@arbora/contracts';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { Audit } from '../common/audit/audit.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TenantsService } from './tenants.service';

@ApiTags('super-admin')
@Controller('tenants')
@Roles('SUPER_ADMIN')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as instituições da plataforma (RF-008)' })
  listar(): Promise<TenantListItem[]> {
    return this.tenantsService.listar();
  }

  // Única rota de domínio que não passa por requireTenantId(user) — é o
  // próprio ato de criar um tenant, então não existe tenantId prévio pra
  // exigir. Precedente proposital, não um bug de roteamento (RF-007).
  @Audit('TENANT_CRIADO', 'Tenant')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra uma nova instituição (RF-007)' })
  criar(
    @Body(new ZodValidationPipe(criarTenantRequestSchema)) body: CriarTenantRequest,
  ): Promise<{ id: string }> {
    return this.tenantsService.criar(body);
  }

  @Audit('TENANT_STATUS_ALTERADO', 'Tenant')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Ativa ou suspende uma instituição (RF-008)' })
  atualizarStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(atualizarStatusTenantRequestSchema))
    body: AtualizarStatusTenantRequest,
  ): Promise<{ id: string }> {
    return this.tenantsService.atualizarStatus(id, body.status);
  }
}
