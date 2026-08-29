import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('verifica com sucesso um hash gerado pela própria senha', async () => {
    const hash = await service.hash('SenhaForte2026');
    await expect(service.verify(hash, 'SenhaForte2026')).resolves.toBe(true);
  });

  it('rejeita uma senha incorreta', async () => {
    const hash = await service.hash('SenhaForte2026');
    await expect(service.verify(hash, 'OutraSenha123')).resolves.toBe(false);
  });

  it('gera hashes diferentes para a mesma senha (salt aleatório)', async () => {
    const [primeiro, segundo] = await Promise.all([
      service.hash('SenhaForte2026'),
      service.hash('SenhaForte2026'),
    ]);
    expect(primeiro).not.toBe(segundo);
  });
});
