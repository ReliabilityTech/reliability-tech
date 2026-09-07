import {
  type AlunoListItem,
  type AlunoPerfil,
  type CriarAlunoRequest,
  criarAlunoRequestSchema,
} from '@arbora/contracts';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AccessTokenPayload } from '../auth/types/access-token-payload';
import { Audit } from '../common/audit/audit.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
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

  @Roles('ADMIN_ESCOLAR', 'COORDENACAO')
  @Audit('ALUNO_CRIADO', 'Aluno')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra um aluno (RF-009)' })
  criar(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(criarAlunoRequestSchema)) body: CriarAlunoRequest,
  ): Promise<{ id: string }> {
    return this.alunosService.criar(requireTenantId(user), body);
  }

  @Roles('ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR')
  @Get(':id')
  @ApiOperation({ summary: 'Perfil completo de um aluno (RF-011)' })
  perfil(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<AlunoPerfil> {
    return this.alunosService.perfil(requireTenantId(user), id);
  }
}
