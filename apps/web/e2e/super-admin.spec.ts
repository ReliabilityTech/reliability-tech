import { expect, test } from '@playwright/test';

test.use({ storageState: '.auth/super-admin.json' });

test('lista instituições e alterna o status', async ({ page }) => {
  await page.goto('/super-admin');

  const linhaHorizonte = page.locator('tr', { hasText: 'Escola Horizonte' });
  await expect(linhaHorizonte.getByText('Suspenso')).toBeVisible();

  await linhaHorizonte.getByRole('button', { name: 'Ativar' }).click();
  await expect(linhaHorizonte.getByText('Ativo')).toBeVisible();

  // Devolve o estado original pra não vazar pro resto da suíte.
  await linhaHorizonte.getByRole('button', { name: 'Suspender' }).click();
  await expect(linhaHorizonte.getByText('Suspenso')).toBeVisible();
});

test('cria uma nova instituição', async ({ page }) => {
  await page.goto('/super-admin');
  await page.getByRole('button', { name: 'Nova instituição' }).click();

  const dialog = page.locator('dialog');
  await dialog.getByLabel('Nome').fill('Escola E2E');
  await dialog.getByLabel('Identificador (slug)').fill('escola-e2e');
  await dialog.getByLabel('Plano').fill('piloto');
  await dialog.getByRole('button', { name: 'Cadastrar' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.locator('tr', { hasText: 'Escola E2E' })).toBeVisible();
});
