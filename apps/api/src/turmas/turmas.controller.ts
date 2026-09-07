import {
  type CriarTurmaRequest,
  criarTurmaRequestSchema,
  type TurmaListItem,
} from '@arbora/contracts';
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AccessTokenPayload } from '../auth/types/access-token-payload';
import { Audit } from '../common/audit/audit.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { requireTenantId } from '../common/tenant.util';
import { TurmasService } from './turmas.service';

@ApiTags('turmas')
@Controller('turmas')
@Roles('ADMIN_ESCOLAR', 'COORDENACAO')
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as turmas da instituição (RF-009)' })
  listar(@CurrentUser() user: AccessTokenPayload): Promise<TurmaListItem[]> {
    return this.turmasService.listar(requireTenantId(user));
  }

  @Audit('TURMA_CRIADA', 'Turma')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra uma turma (RF-009)' })
  criar(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(criarTurmaRequestSchema)) body: CriarTurmaRequest,
  ): Promise<{ id: string }> {
    return this.turmasService.criar(requireTenantId(user), body);
  }
}
