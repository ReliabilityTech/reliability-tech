import { apiErrorSchema, ERROR_CODES } from '@arbora/contracts';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';

import { AllExceptionsFilter } from './all-exceptions.filter';

type RespostaCapturada = { status: number; body: unknown };

function criarHost(requestId?: string | number) {
  const capturado: RespostaCapturada = { status: 0, body: null };

  const response = {
    status(code: number) {
      capturado.status = code;
      return this;
    },
    json(body: unknown) {
      capturado.body = body;
    },
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'GET', url: '/api/v1/teste', id: requestId }),
    }),
  };

  return { host, capturado };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  beforeAll(() => {
    // O filtro loga erros 5xx; silencia o ruído na saída dos testes.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('produz um envelope que satisfaz o schema ApiError', () => {
    const { host, capturado } = criarHost('req-1');
    filter.catch(new HttpException('Não encontrado', HttpStatus.NOT_FOUND), host as never);

    expect(capturado.status).toBe(404);
    expect(apiErrorSchema.safeParse(capturado.body).success).toBe(true);
  });

  it('converte requestId numérico em string', () => {
    // Regressão: o pino-http gera ids numéricos por padrão, e um número aqui
    // faria o front rejeitar o envelope inteiro.
    const { host, capturado } = criarHost(42);
    filter.catch(new HttpException('erro', HttpStatus.BAD_REQUEST), host as never);

    expect(apiErrorSchema.parse(capturado.body).requestId).toBe('42');
  });

  it('omite requestId quando não há id na requisição', () => {
    const { host, capturado } = criarHost(undefined);
    filter.catch(new HttpException('erro', HttpStatus.BAD_REQUEST), host as never);

    expect(apiErrorSchema.parse(capturado.body).requestId).toBeUndefined();
  });

  it('mapeia o status HTTP para o código de erro correspondente', () => {
    const { host, capturado } = criarHost('req-2');
    filter.catch(new HttpException('sem permissão', HttpStatus.FORBIDDEN), host as never);

    expect(apiErrorSchema.parse(capturado.body).code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it('não vaza a mensagem de exceções inesperadas para o cliente', () => {
    const { host, capturado } = criarHost('req-3');
    filter.catch(new Error('senha do banco: hunter2'), host as never);

    const erro = apiErrorSchema.parse(capturado.body);
    expect(capturado.status).toBe(500);
    expect(erro.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(erro.message).toBe('Erro interno no servidor');
    expect(JSON.stringify(erro)).not.toContain('hunter2');
  });

  it('preserva os detalhes de validação vindos do ZodValidationPipe', () => {
    const { host, capturado } = criarHost('req-4');
    filter.catch(
      new HttpException(
        {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Dados inválidos na requisição',
          details: [{ path: 'email', message: 'E-mail inválido' }],
        },
        HttpStatus.BAD_REQUEST,
      ),
      host as never,
    );

    const erro = apiErrorSchema.parse(capturado.body);
    expect(erro.details).toEqual([{ path: 'email', message: 'E-mail inválido' }]);
  });
});
