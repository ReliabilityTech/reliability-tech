import {
  type CriarDisciplinaRequest,
  criarDisciplinaRequestSchema,
  type DisciplinaListItem,
} from '@arbora/contracts';
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AccessTokenPayload } from '../auth/types/access-token-payload';
import { Audit } from '../common/audit/audit.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { requireTenantId } from '../common/tenant.util';
import { DisciplinasService } from './disciplinas.service';

@ApiTags('disciplinas')
@Controller('disciplinas')
@Roles('ADMIN_ESCOLAR', 'COORDENACAO')
export class DisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as disciplinas da instituição (RF-009)' })
  listar(@CurrentUser() user: AccessTokenPayload): Promise<DisciplinaListItem[]> {
    return this.disciplinasService.listar(requireTenantId(user));
  }

  @Audit('DISCIPLINA_CRIADA', 'Disciplina')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra uma disciplina (RF-009)' })
  criar(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(criarDisciplinaRequestSchema)) body: CriarDisciplinaRequest,
  ): Promise<{ id: string }> {
    return this.disciplinasService.criar(requireTenantId(user), body);
  }
}
