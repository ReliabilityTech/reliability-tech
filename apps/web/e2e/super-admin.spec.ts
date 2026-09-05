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
