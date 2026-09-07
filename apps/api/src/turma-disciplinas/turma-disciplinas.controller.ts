import {
  type CriarTurmaDisciplinaRequest,
  criarTurmaDisciplinaRequestSchema,
} from '@arbora/contracts';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AccessTokenPayload } from '../auth/types/access-token-payload';
import { Audit } from '../common/audit/audit.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { requireTenantId } from '../common/tenant.util';
import { TurmaDisciplinasService } from './turma-disciplinas.service';

@ApiTags('turma-disciplinas')
@Controller('turma-disciplinas')
@Roles('ADMIN_ESCOLAR', 'COORDENACAO')
export class TurmaDisciplinasController {
  constructor(private readonly turmaDisciplinasService: TurmaDisciplinasService) {}

  @Audit('TURMA_DISCIPLINA_ATRIBUIDA', 'TurmaDisciplina')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Atribui um professor a uma turma+disciplina, trocando se já houver um (RF-009)',
  })
  atribuir(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(criarTurmaDisciplinaRequestSchema))
    body: CriarTurmaDisciplinaRequest,
  ): Promise<{ id: string }> {
    return this.turmaDisciplinasService.atribuir(requireTenantId(user), body);
  }
}
