import {
  type AtualizarStatusTenantRequest,
  atualizarStatusTenantRequestSchema,
  type TenantListItem,
} from '@arbora/contracts';
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
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
