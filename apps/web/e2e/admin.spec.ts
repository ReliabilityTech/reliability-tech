import { expect, test } from '@playwright/test';

test.use({ storageState: '.auth/admin.json' });

test('dashboard mostra indicadores reais da instituição', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
  await expect(page.getByText('Atenção necessária')).toBeVisible();
  await expect(page.getByText('Atividades recentes')).toBeVisible();
});

test('lista alunos e abre o perfil com dado real', async ({ page }) => {
  await page.goto('/alunos');
  const linha = page.getByRole('link', { name: 'Pedro Pereira' });
  await expect(linha).toBeVisible();

  await linha.click();
  // expect(page).toHaveURL, não page.waitForURL — ver nota em auth.setup.ts:
  // waitForURL espera evento de navegação e trava em transições client-side
  // do App Router; toHaveURL faz polling de page.url() e não tem esse problema.
  await expect(page).toHaveURL(/\/alunos\/.+/);
  await expect(page.getByRole('heading', { name: 'Pedro Pereira' })).toBeVisible();
  await expect(page.getByText('Responsáveis vinculados')).toBeVisible();
  await expect(page.getByText('Média geral')).toBeVisible();
});

test('comunicado vazio é bloqueado no client antes de ir pra API', async ({ page }) => {
  await page.goto('/comunicados');
  await page.getByRole('button', { name: 'Novo comunicado' }).click();

  const dialog = page.locator('dialog');
  await dialog.getByLabel('Título').fill(' ');
  await dialog.getByLabel('Mensagem').fill('corpo válido');

  const chamadasApi: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/v1/recados') && req.method() === 'POST')
      chamadasApi.push(req.url());
  });

  await dialog.getByRole('button', { name: 'Publicar' }).click();
  // Escopado no dialog: page.getByRole('alert') também pega o
  // __next-route-announcer__ que o App Router injeta após navegação client-side.
  await expect(dialog.getByRole('alert')).toHaveText('Informe um título');
  expect(chamadasApi).toHaveLength(0);
});

test('publica um comunicado válido para toda a instituição', async ({ page }) => {
  await page.goto('/comunicados');
  const cardPublicados = page.locator('article', { hasText: 'Publicados' });
  const antes = Number(await cardPublicados.locator('p').last().textContent());

  await page.getByRole('button', { name: 'Novo comunicado' }).click();
  const dialog = page.locator('dialog');
  await dialog.getByLabel('Título').fill('Aviso E2E');
  await dialog.getByLabel('Mensagem').fill('Mensagem criada pelo teste E2E.');
  await dialog.getByRole('button', { name: 'Publicar' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText('Aviso E2E')).toBeVisible();
  await expect(cardPublicados.locator('p').last()).toHaveText(String(antes + 1));
});

test('cadastra um aluno sem turma', async ({ page }) => {
  await page.goto('/alunos');
  await page.getByRole('button', { name: 'Cadastrar aluno' }).click();

  const dialog = page.locator('dialog');
  await dialog.getByLabel('Nome').fill('Aluno E2E');
  await dialog.getByLabel('Data de nascimento').fill('2016-05-10');
  await dialog.getByLabel('Matrícula').fill('e2e-0001');
  await dialog.getByRole('button', { name: 'Cadastrar' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole('link', { name: 'Aluno E2E' })).toBeVisible();
});

test('vincula um responsável a um aluno existente, criando a conta', async ({ page }) => {
  await page.goto('/alunos');
  await page.getByRole('link', { name: 'Pedro Pereira' }).click();
  await expect(page).toHaveURL(/\/alunos\/.+/);

  await page.getByRole('button', { name: 'Vincular responsável' }).click();
  const dialog = page.locator('dialog');
  await dialog.getByLabel('Nome').fill('Responsável E2E');
  await dialog.getByLabel('E-mail').fill('responsavel-e2e@exemplo.com');
  await dialog.getByLabel(/^Senha/).fill('SenhaForte123');
  await dialog.getByLabel('Parentesco').fill('tio');
  await dialog.getByRole('button', { name: 'Vincular' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText('Responsável E2E')).toBeVisible();
  await expect(page.getByText('responsavel-e2e@exemplo.com')).toBeVisible();
});
