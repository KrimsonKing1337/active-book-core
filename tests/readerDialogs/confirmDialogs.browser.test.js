import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clickOutside, openDialogs, travel, waitPosition } from './readerDialogsFixture.js';

test('locked confirmation rejects Escape, outside and native Back; replacement starts a fresh timer', async (context) => {
  const { page } = await openDialogs(context);
  await page.getByRole('button', { name: 'Показать подтверждение', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Проверка подтверждения' });
  const confirm = dialog.getByRole('button', { name: /^Подтвердить/ });
  assert.ok(await confirm.isDisabled());
  await page.keyboard.press('Escape');
  await clickOutside(page);
  await travel(page, -1);
  await waitPosition(page, 'guard');
  assert.equal(await dialog.count(), 1);
  assert.equal(await page.getByTestId('background-clicks').textContent(), '0');
  await dialog.getByRole('button', { name: 'Подтвердить (1)', exact: true }).waitFor();
  const old = await page.evaluate(() => ({
    id: window.readDialogState().windows.activeWindow.instanceId,
    deadline: performance.now() + 1100,
  }));
  await dialog.getByRole('button', { name: 'Закрыть и открыть снова', exact: true }).click();
  assert.notEqual(await page.evaluate(() => window.readDialogState().windows.activeWindow.instanceId), old.id);
  await dialog.getByRole('button', { name: 'Подтвердить (2)', exact: true }).waitFor();
  await page.waitForFunction((deadline) => performance.now() >= deadline, old.deadline);
  assert.ok(await confirm.isDisabled(), 'the retired deadline cannot unlock the successor');
  await dialog.getByRole('button', { name: 'Подтвердить', exact: true }).waitFor();
  assert.ok(await page.evaluate(() => window.readDialogState().windows.activeWindow.canClose));
  await confirm.click();
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await page.getByTestId('confirmed').textContent(), '1');
  await waitPosition(page, 'base');
});

test('confirmation without delay is immediately available; cancel and confirmation consume their own Guard', async (context) => {
  const { page } = await openDialogs(context, { search: 'delay=0' });
  await page.getByRole('button', { name: 'Показать подтверждение', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Проверка подтверждения' });
  assert.ok(await dialog.getByRole('button', { name: 'Подтвердить', exact: true }).isEnabled());
  await dialog.getByRole('button', { name: 'Отмена', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  await waitPosition(page, 'base');
  assert.equal(await page.getByTestId('confirmed').textContent(), '0');
  await page.getByRole('button', { name: 'Показать подтверждение', exact: true }).click();
  await dialog.getByRole('button', { name: 'Подтвердить', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  await waitPosition(page, 'base');
  assert.equal(await page.getByTestId('confirmed').textContent(), '1');
});
