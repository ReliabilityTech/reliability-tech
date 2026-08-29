import { type HealthResponse } from '@arbora/contracts';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../auth/decorators/public.decorator';
import { HealthService } from './health.service';

/** Sem sessão: orquestrador e monitoramento externo batem aqui sem autenticar. */
@ApiTags('health')
@Controller('health')
@SkipThrottle()
@Public()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Estado do serviço e de suas dependências' })
  @ApiOkResponse({ description: 'Diagnóstico agregado do serviço' })
  check(): Promise<HealthResponse> {
    return this.health.check();
  }

  /**
   * Liveness para o orquestrador: responde sem tocar em dependências externas,
   * assim uma queda do banco não provoca reinício do container.
   */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe' })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
