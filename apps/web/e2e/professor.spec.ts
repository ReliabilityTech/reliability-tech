import { expect, test } from '@playwright/test';

test.use({ storageState: '.auth/professor.json' });

test('nota fora de 0-10 é bloqueada antes de chamar a API', async ({ page }) => {
  await page.goto('/notas');
  const linhaAna = page.locator('tr', { hasText: 'Ana Costa' });
  const input = linhaAna.getByRole('textbox');

  await input.fill('15');

  const chamadasApi: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/v1/professor/notas')) chamadasApi.push(req.url());
  });

  await page.getByRole('button', { name: 'Salvar notas' }).click();
  // Escopado na linha: page.getByRole('alert') também pega o
  // __next-route-announcer__ que o App Router injeta após navegação client-side.
  await expect(linhaAna.getByRole('alert')).toHaveText('A nota máxima é 10');
  expect(chamadasApi).toHaveLength(0);
});

test('lança uma nota válida e ela persiste após recarregar', async ({ page }) => {
  await page.goto('/notas');
  const linhaAna = page.locator('tr', { hasText: 'Ana Costa' });
  await linhaAna.getByRole('textbox').fill('7.2');
  await page.getByRole('button', { name: 'Salvar notas' }).click();

  await expect(page.locator('table').getByRole('alert')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('tr', { hasText: 'Ana Costa' }).getByRole('textbox')).toHaveValue(
    '7.2',
  );
});

test('marca presença e ela persiste após recarregar', async ({ page }) => {
  await page.goto('/chamada');
  const linha = page.locator('li', { hasText: 'Ana Costa' });
  const botaoPresenca = linha.getByRole('button');
  const estadoInicial = await botaoPresenca.textContent();

  await botaoPresenca.click();
  await page.getByRole('button', { name: 'Salvar chamada' }).click();
  await page.waitForResponse((res) => res.url().includes('/api/v1/professor/presencas'));

  await page.reload();
  const estadoFinal = await page
    .locator('li', { hasText: 'Ana Costa' })
    .getByRole('button')
    .textContent();
  expect(estadoFinal).not.toBe(estadoInicial);
});
