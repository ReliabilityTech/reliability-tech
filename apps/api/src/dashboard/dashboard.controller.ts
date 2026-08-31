import {
  type DashboardAdminResponse,
  type DashboardProfessorResponse,
  type DashboardSuperAdminResponse,
} from '@arbora/contracts';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AccessTokenPayload } from '../auth/types/access-token-payload';
import { requireTenantId } from '../common/tenant.util';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles('ADMIN_ESCOLAR', 'COORDENACAO')
  @Get('admin')
  @ApiOperation({ summary: 'Indicadores da instituição (RF-028)' })
  admin(@CurrentUser() user: AccessTokenPayload): Promise<DashboardAdminResponse> {
    return this.dashboardService.admin(requireTenantId(user));
  }

  @Roles('PROFESSOR')
  @Get('professor')
  @ApiOperation({ summary: 'Turmas e disciplinas do professor logado' })
  professor(@CurrentUser() user: AccessTokenPayload): Promise<DashboardProfessorResponse> {
    return this.dashboardService.professor(requireTenantId(user), user.sub);
  }

  @Roles('SUPER_ADMIN')
  @Get('super-admin')
  @ApiOperation({ summary: 'Indicadores globais da plataforma (RF-008)' })
  superAdmin(): Promise<DashboardSuperAdminResponse> {
    return this.dashboardService.superAdmin();
  }
}
