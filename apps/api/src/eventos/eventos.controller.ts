import {
  type CriarEventoRequest,
  criarEventoRequestSchema,
  type EventoCalendario,
} from '@arbora/contracts';
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AccessTokenPayload } from '../auth/types/access-token-payload';
import { Audit } from '../common/audit/audit.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { requireTenantId } from '../common/tenant.util';
import { EventosService } from './eventos.service';

@ApiTags('agenda')
@Controller('eventos')
@Roles('ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR', 'RESPONSAVEL')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get()
  @ApiOperation({ summary: 'Calendário escolar (RF-024)' })
  listar(@CurrentUser() user: AccessTokenPayload): Promise<EventoCalendario[]> {
    return this.eventosService.listar(requireTenantId(user));
  }

  @Roles('ADMIN_ESCOLAR', 'COORDENACAO')
  @Audit('EVENTO_CRIADO', 'Evento')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra um evento na agenda (RF-025)' })
  criar(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(criarEventoRequestSchema)) body: CriarEventoRequest,
  ): Promise<{ id: string }> {
    return this.eventosService.criar(requireTenantId(user), body);
  }
}
