import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clickOutside, openDialogs, travel, waitPosition } from './readerDialogsFixture.js';

test('mobile Page0 camera warning stays mandatory and confirmation continues initialization', async (context) => {
  const { page } = await openDialogs(context, {
    search: 'start=true',
    page: { viewport: { width: 390, height: 740 }, hasTouch: true },
  });
  const start = page.getByRole('button', { name: /Начать читать|Продолжить читать/ });
  await start.focus();
  await start.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'ОБРАТИТЕ ВНИМАНИЕ', exact: true });
  await dialog.waitFor();
  assert.equal(await page.evaluate(() => window.readDialogState().main.isAudioUnlocked), true);
  assert.ok(await dialog.getByRole('button', { name: /^Хорошо/ }).isDisabled());
  await page.keyboard.press('Escape');
  await clickOutside(page);
  await travel(page, -1);
  await waitPosition(page, 'guard');
  assert.equal(await dialog.count(), 1);
  await dialog.getByRole('button', { name: 'Хорошо', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.readDialogState().windows.activeWindow.canClose), false);
  await page.keyboard.press('Escape');
  await clickOutside(page);
  await travel(page, -1);
  await waitPosition(page, 'guard');
  assert.equal(await dialog.count(), 1, 'confirmation readiness does not permit user cancellation');
  await dialog.getByRole('button', { name: 'Хорошо', exact: true }).click();
  await page.getByTestId('reader-content').waitFor();
  assert.equal(await page.getByTestId('continued').textContent(), '1');
  await waitPosition(page, 'base');
  await page.reload();
  const resume = page.getByRole('button', { name: /Начать читать|Продолжить читать/ });
  await resume.focus();
  await resume.press('Enter');
  await page.getByTestId('reader-content').waitFor();
  assert.equal(await page.evaluate(() => window.readDialogState().main.isAudioUnlocked), true);
  assert.equal(await page.getByRole('dialog').count(), 0, 'confirmed camera notice is remembered');
});

test('WelcomeTour confirms after delay, highlights controls, and supports skip and completion', async (context) => {
  const { page } = await openDialogs(context, { search: 'start=true&tour=true' });
  await page.getByRole('button', { name: /Начать читать|Продолжить читать/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Перед тем как начнём...', exact: true });
  await dialog.getByRole('button', { name: 'Хорошо', exact: true }).waitFor();
  await dialog.getByRole('button', { name: 'Хорошо', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  await page.getByRole('button', { name: 'Далее', exact: true }).waitFor();
  assert.equal(await page.locator('[data-welcome-tour-id="action"]').evaluate((node) => {
    return node.classList.contains('welcomeTourHighLight');
  }), true);
  await page.getByRole('button', { name: 'Пропустить обучение', exact: true }).click();
  assert.equal(await page.locator('.welcomeTourHighLight').count(), 0);
  await waitPosition(page, 'base');
  // A new reader run with tour enabled verifies the actual completion path independently.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /Начать читать|Продолжить читать/ }).click();
  await dialog.getByRole('button', { name: 'Хорошо', exact: true }).click();
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole('button', { name: 'Далее', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Закончить знакомство', exact: true }).click();
  assert.equal(await page.locator('.welcomeTourHighLight').count(), 0);
  assert.equal(await page.evaluate(() => window.readDialogState().config.welcomeTour), false);
});

test('Nav swipe notice is delayed, remembers confirmation and retains the original navigation behavior', async (context) => {
  const { page } = await openDialogs(context);
  const next = page.getByRole('button', { name: 'Следующая страница', exact: true });
  await next.click();
  const dialog = page.getByRole('dialog', { name: 'Вы можете использовать свайпы', exact: true });
  await dialog.waitFor();
  assert.ok(await dialog.getByRole('button', { name: /^Хорошо/ }).isDisabled());
  await dialog.getByRole('button', { name: 'Хорошо', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  await waitPosition(page, 'base');
  assert.equal(await page.evaluate(() => window.readDialogState().main.pageId), 'page-a');
  await next.click();
  await page.getByTestId('second-page').waitFor();
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.getByRole('button', { name: 'Предыдущая страница', exact: true }).click();
  await page.getByTestId('reader-content').waitFor();
  await next.click();
  await page.getByTestId('second-page').waitFor();
  assert.equal(await page.getByRole('dialog').count(), 0);
});
