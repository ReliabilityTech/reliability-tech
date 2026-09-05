import path from 'node:path';

import { expect, test as setup } from '@playwright/test';

const SENHA = 'ArboraDev2026';

const PAPEIS = [
  { arquivo: 'admin', email: 'admin@colegio-arbora.local' },
  { arquivo: 'professor', email: 'professor@colegio-arbora.local' },
  { arquivo: 'super-admin', email: 'superadmin@arbora.local' },
  { arquivo: 'responsavel', email: 'responsavel@colegio-arbora.local' },
];

for (const { arquivo, email } of PAPEIS) {
  setup(`login como ${arquivo}`, async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha').fill(SENHA);
    await page.getByRole('button', { name: 'Entrar' }).click();
    // expect(page).toHaveURL (poll de page.url(), não evento de navegação) —
    // page.waitForURL trava aqui porque o App Router faz login -> router.push('/')
    // -> redirect() do servidor pra /dashboard; o segundo salto é uma
    // transição client-side sem evento de "load", e waitForURL nunca reancora
    // nele depois de já ter resolvido no primeiro salto (visto direto no log:
    // "navigated to http://localhost:3000/" e trava aí).
    // Timeout maior só aqui: o webServer fica "pronto" assim que GET /login
    // compila, mas o papel que roda primeiro (sempre admin, ordem de PAPEIS)
    // ainda paga o primeiro hit real de /dashboard (compilação + agregação
    // Prisma a frio) — já visto passar de 30s numa run com boot 100% a frio.
    await expect(page).toHaveURL(/\/(dashboard|super-admin)/, { timeout: 60_000 });
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
    await page.context().storageState({ path: path.join('.auth', `${arquivo}.json`) });
  });
}
