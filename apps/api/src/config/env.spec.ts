import { parseCorsOrigins, validateEnv } from './env';

const baseEnv = {
  DATABASE_URL: 'postgresql://arbora:arbora@localhost:5432/arbora',
  APP_DATABASE_URL: 'postgresql://arbora_app:arbora_app@localhost:5432/arbora',
  JWT_SECRET: 'a'.repeat(32),
};

describe('validateEnv', () => {
  it('aplica os padrões para variáveis opcionais', () => {
    const env = validateEnv({ ...baseEnv });
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3333);
    expect(env.SWAGGER_ENABLED).toBe(true);
  });

  it('converte PORT vinda como string para número', () => {
    expect(validateEnv({ ...baseEnv, PORT: '8080' }).PORT).toBe(8080);
  });

  it('falha quando DATABASE_URL está ausente', () => {
    expect(() => validateEnv({ ...baseEnv, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it('falha quando APP_DATABASE_URL está ausente', () => {
    expect(() => validateEnv({ ...baseEnv, APP_DATABASE_URL: undefined })).toThrow(
      /APP_DATABASE_URL/,
    );
  });

  it('falha quando JWT_SECRET é curto demais', () => {
    expect(() => validateEnv({ ...baseEnv, JWT_SECRET: 'curto' })).toThrow(/JWT_SECRET/);
  });

  it('interpreta SWAGGER_ENABLED=false como booleano falso', () => {
    expect(validateEnv({ ...baseEnv, SWAGGER_ENABLED: 'false' }).SWAGGER_ENABLED).toBe(false);
  });
});

describe('parseCorsOrigins', () => {
  it('separa por vírgula, remove espaços e descarta entradas vazias', () => {
    expect(parseCorsOrigins('http://a.com, http://b.com , ')).toEqual([
      'http://a.com',
      'http://b.com',
    ]);
  });
});
