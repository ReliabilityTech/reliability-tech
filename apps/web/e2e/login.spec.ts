import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('faz login e chega no dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('admin@colegio-arbora.local');
  await page.getByLabel('Senha').fill('ArboraDev2026');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
});

test('credencial inválida mostra erro anunciado por leitor de tela', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('admin@colegio-arbora.local');
  await page.getByLabel('Senha').fill('senha-errada');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Escopado no form: page.getByRole('alert') também pegaria o
  // __next-route-announcer__ do App Router se uma navegação já tivesse ocorrido.
  const erro = page.locator('form').getByRole('alert');
  await expect(erro).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
