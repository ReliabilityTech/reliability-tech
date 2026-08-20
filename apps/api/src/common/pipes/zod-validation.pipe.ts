import { ERROR_CODES } from '@arbora/contracts';
import { type ArgumentMetadata, BadRequestException, type PipeTransform } from '@nestjs/common';
import { type ZodTypeAny } from 'zod';

/**
 * Valida o payload contra um schema Zod de `@arbora/contracts`, garantindo que
 * API e Web compartilhem exatamente a mesma regra de validação.
 *
 * Uso: `@Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequest`
 */
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Dados inválidos na requisição',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return result.data;
  }
}
