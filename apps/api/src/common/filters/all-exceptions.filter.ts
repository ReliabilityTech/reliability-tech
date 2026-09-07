import { type ApiError, ERROR_CODES, type ErrorCode } from '@arbora/contracts';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { type Request, type Response } from 'express';

type NestErrorBody = {
  code?: string;
  message?: string | string[];
  details?: ApiError['details'];
};

const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ERROR_CODES.VALIDATION_ERROR,
  [HttpStatus.UNAUTHORIZED]: ERROR_CODES.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ERROR_CODES.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ERROR_CODES.NOT_FOUND,
  [HttpStatus.CONFLICT]: ERROR_CODES.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: ERROR_CODES.RATE_LIMITED,
};

/**
 * Converte qualquer exceção no envelope `ApiError` definido em
 * `@arbora/contracts`, para que o front tenha um único formato de erro.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string | number }>();

    const isHttp = exception instanceof HttpException;
    const statusCode = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttp ? this.readBody(exception) : {};

    // Detalhes de erros inesperados nunca vazam para o cliente: só o log e o
    // Sentry os veem. 4xx são erro de quem chamou (validação, permissão),
    // não da aplicação — não polui o monitoramento de erro com eles.
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} falhou`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      Sentry.captureException(exception);
    }

    const payload: ApiError = {
      statusCode,
      code: body.code ?? STATUS_TO_CODE[statusCode] ?? ERROR_CODES.INTERNAL_ERROR,
      message: this.readMessage(body, statusCode),
      ...(body.details ? { details: body.details } : {}),
      // Coerção deliberada: `ApiError.requestId` é string no contrato, e um
      // id numérico faria o front rejeitar o envelope inteiro.
      ...(request.id === undefined ? {} : { requestId: String(request.id) }),
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(payload);
  }

  private readBody(exception: HttpException): NestErrorBody {
    const response = exception.getResponse();
    return typeof response === 'object' && response !== null
      ? (response as NestErrorBody)
      : { message: String(response) };
  }

  private readMessage(body: NestErrorBody, statusCode: number): string {
    if (Array.isArray(body.message)) return body.message.join('; ');
    if (body.message) return body.message;
    return statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Erro interno no servidor'
      : 'Requisição inválida';
  }
}
