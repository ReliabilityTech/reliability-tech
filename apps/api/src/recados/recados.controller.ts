import {
  type CriarRecadoRequest,
  criarRecadoRequestSchema,
  type RecadoListItem,
} from '@arbora/contracts';
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AccessTokenPayload } from '../auth/types/access-token-payload';
import { Audit } from '../common/audit/audit.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { requireTenantId } from '../common/tenant.util';
import { RecadosService } from './recados.service';

@ApiTags('recados')
@Controller('recados')
@Roles('ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR')
export class RecadosController {
  constructor(private readonly recadosService: RecadosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista comunicados publicados (RF-015)' })
  listar(@CurrentUser() user: AccessTokenPayload): Promise<RecadoListItem[]> {
    return this.recadosService.listar(requireTenantId(user));
  }

  @Audit('RECADO_PUBLICADO', 'Recado')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publica um novo comunicado (RF-015, RF-018)' })
  criar(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(criarRecadoRequestSchema)) body: CriarRecadoRequest,
  ): Promise<{ id: string }> {
    return this.recadosService.criar(requireTenantId(user), user.sub, body);
  }
}
