import { type AlunoListItem, type AlunoPerfil } from '@arbora/contracts';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AccessTokenPayload } from '../auth/types/access-token-payload';
import { requireTenantId } from '../common/tenant.util';
import { AlunosService } from './alunos.service';

@ApiTags('alunos')
@Controller('alunos')
export class AlunosController {
  constructor(private readonly alunosService: AlunosService) {}

  @Roles('ADMIN_ESCOLAR', 'COORDENACAO')
  @Get()
  @ApiOperation({ summary: 'Lista os alunos da instituição (RF-009)' })
  listar(@CurrentUser() user: AccessTokenPayload): Promise<AlunoListItem[]> {
    return this.alunosService.listar(requireTenantId(user));
  }

  @Roles('ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR')
  @Get(':id')
  @ApiOperation({ summary: 'Perfil completo de um aluno (RF-011)' })
  perfil(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<AlunoPerfil> {
    return this.alunosService.perfil(requireTenantId(user), id);
  }
}
