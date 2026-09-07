import {
  type ProfessorListItem,
  type RegisterRequest,
  registerRequestSchema,
} from '@arbora/contracts';
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AccessTokenPayload } from '../auth/types/access-token-payload';
import { Audit } from '../common/audit/audit.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { requireTenantId } from '../common/tenant.util';
import { UsuariosService } from './usuarios.service';

@ApiTags('usuarios')
@Controller('usuarios')
@Roles('ADMIN_ESCOLAR', 'COORDENACAO')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os professores da instituição (RF-009)' })
  listar(@CurrentUser() user: AccessTokenPayload): Promise<ProfessorListItem[]> {
    return this.usuariosService.listarProfessores(requireTenantId(user));
  }

  @Audit('PROFESSOR_CRIADO', 'User')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra um professor (RF-009)' })
  criar(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(registerRequestSchema)) body: RegisterRequest,
  ): Promise<{ id: string }> {
    return this.usuariosService.criarProfessor(requireTenantId(user), body);
  }
}
