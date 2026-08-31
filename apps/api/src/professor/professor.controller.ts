import {
  type LancarNotaRequest,
  lancarNotaRequestSchema,
  type NotaLancamentoItem,
  type PeriodoLetivoResumo,
  type PresencaItem,
  type RegistrarPresencasRequest,
  registrarPresencasRequestSchema,
  type TurmaDisciplinaResumo,
} from '@arbora/contracts';
import { BadRequestException, Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AccessTokenPayload } from '../auth/types/access-token-payload';
import { Audit } from '../common/audit/audit.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { requireTenantId } from '../common/tenant.util';
import { ProfessorService } from './professor.service';

@ApiTags('professor')
@Controller('professor')
@Roles('PROFESSOR')
export class ProfessorController {
  constructor(private readonly professorService: ProfessorService) {}

  @Get('turmas')
  @ApiOperation({ summary: 'Turmas/disciplinas do professor logado (RF-010, RF-012)' })
  listarTurmas(@CurrentUser() user: AccessTokenPayload): Promise<TurmaDisciplinaResumo[]> {
    return this.professorService.listarTurmas(requireTenantId(user), user.sub);
  }

  @Get('periodos')
  @ApiOperation({ summary: 'Períodos letivos da instituição (RF-010)' })
  listarPeriodos(@CurrentUser() user: AccessTokenPayload): Promise<PeriodoLetivoResumo[]> {
    return this.professorService.listarPeriodos(requireTenantId(user));
  }

  @Get('turmas/:id/notas')
  @ApiOperation({ summary: 'Notas lançadas para uma turma/disciplina num período (RF-010)' })
  listarNotas(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') turmaDisciplinaId: string,
    @Query('periodoLetivoId') periodoLetivoId?: string,
  ): Promise<NotaLancamentoItem[]> {
    if (!periodoLetivoId) throw new BadRequestException('periodoLetivoId é obrigatório');
    return this.professorService.listarNotas(
      requireTenantId(user),
      user.sub,
      turmaDisciplinaId,
      periodoLetivoId,
    );
  }

  @Audit('NOTA_LANCADA', 'Nota')
  @Put('notas')
  @ApiOperation({ summary: 'Lança ou atualiza a nota de um aluno (RF-010, RF-029)' })
  lancarNota(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(lancarNotaRequestSchema)) body: LancarNotaRequest,
  ): Promise<{ id: string }> {
    return this.professorService.lancarNota(requireTenantId(user), user.sub, body);
  }

  @Get('turmas/:id/presencas')
  @ApiOperation({ summary: 'Presença de uma turma/disciplina numa data (RF-012)' })
  listarPresencas(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') turmaDisciplinaId: string,
    @Query('data') data?: string,
  ): Promise<PresencaItem[]> {
    if (!data) throw new BadRequestException('data é obrigatória (YYYY-MM-DD)');
    return this.professorService.listarPresencas(
      requireTenantId(user),
      user.sub,
      turmaDisciplinaId,
      data,
    );
  }

  @Audit('PRESENCA_REGISTRADA', 'Presenca')
  @Put('presencas')
  @ApiOperation({ summary: 'Registra presença/falta em lote (RF-012, RF-013)' })
  registrarPresencas(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(registrarPresencasRequestSchema)) body: RegistrarPresencasRequest,
  ): Promise<{ registrados: number }> {
    return this.professorService.registrarPresencas(requireTenantId(user), user.sub, body);
  }
}
