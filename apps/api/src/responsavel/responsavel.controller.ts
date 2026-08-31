import { type MovimentacaoItem, type ResponsavelAlunoResumo } from '@arbora/contracts';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AccessTokenPayload } from '../auth/types/access-token-payload';
import { requireTenantId } from '../common/tenant.util';
import { ResponsavelService } from './responsavel.service';

@ApiTags('responsavel')
@Controller('responsavel')
@Roles('RESPONSAVEL')
export class ResponsavelController {
  constructor(private readonly responsavelService: ResponsavelService) {}

  @Get('alunos')
  @ApiOperation({ summary: 'Alunos vinculados ao responsável logado (RF-019)' })
  listarAlunos(@CurrentUser() user: AccessTokenPayload): Promise<ResponsavelAlunoResumo[]> {
    return this.responsavelService.listarAlunos(requireTenantId(user), user.sub);
  }

  @Get('alunos/:id/movimentacoes')
  @ApiOperation({ summary: 'Últimas entradas/saídas registradas para o aluno (RF-020)' })
  listarMovimentacoes(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') alunoId: string,
  ): Promise<MovimentacaoItem[]> {
    return this.responsavelService.listarMovimentacoes(requireTenantId(user), user.sub, alunoId);
  }
}
