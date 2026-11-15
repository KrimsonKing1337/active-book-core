import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openBrowserFixture } from '../browserFixture.js';

test('one Redux window replaces content and ignores stale callbacks without losing Dialog focus', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage();
  context.after(() => page.close());
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${origin}/tests/storyWindows/`);
  await page.getByTestId('open-a').waitFor();
  const historyBefore = await page.evaluate(() => history.length);
  await page.getByTestId('open-a').click();
  await page.getByRole('dialog', { name: 'Окно A', exact: true }).waitFor();
  const first = await page.evaluate(() => {
    window.windowFixture.captureCallbacks();
    return window.windowFixture.getState().activeWindow;
  });

  await page.getByRole('textbox').fill('State owned by A');
  await page.getByRole('button', { name: 'Заменить на B' }).click();
  const dialog = page.getByRole('dialog', { name: 'Окно B', exact: true });
  await dialog.waitFor();
  assert.equal(await page.getByRole('dialog').count(), 1);
  assert.equal(await dialog.getByRole('textbox').inputValue(), 'B', 'replacement unmounts old content');
  await page.waitForFunction(() => document.querySelector('[role="dialog"]').contains(document.activeElement));
  await page.evaluate(() => {
    window.windowFixture.lateClose();
    window.windowFixture.lateForceClose();
  });
  assert.equal(await dialog.count(), 1);
  const second = await page.evaluate(() => window.windowFixture.getState().activeWindow);
  assert.notEqual(first.instanceId, second.instanceId);

  const reopened = await page.evaluate(() => window.windowFixture.open('B'));
  assert.notEqual(reopened, second.instanceId);
  assert.equal(await page.getByRole('dialog').count(), 1);
  await page.keyboard.press('Tab');
  assert.equal(await dialog.evaluate((element) => element.contains(document.activeElement)), true);
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
  await page.waitForFunction(() => document.activeElement === document.querySelector('[data-testid="open-a"]'));
  await page.waitForFunction(() => history.state?.activeBookWindows?.position === 'base');
  assert.equal(await page.evaluate(() => history.length), historyBefore + 1);
  assert.deepEqual(errors, []);
});

test('locked windows allow forced close and replacement; rapid reopen does not restore old focus', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage();
  context.after(() => page.close());
  await page.goto(`${origin}/tests/storyWindows/`);
  await page.getByTestId('open-a').waitFor();
  const id = await page.evaluate(() => window.windowFixture.open('locked', false));
  await page.getByRole('dialog', { name: 'Окно locked' }).waitFor();
  await page.keyboard.press('Escape');
  await page.evaluate((instanceId) => window.windowFixture.requestClose(instanceId), id);
  assert.equal(await page.getByRole('dialog').count(), 1);
  await page.evaluate(() => window.windowFixture.open('B'));
  await page.getByRole('dialog', { name: 'Окно B' }).waitFor();
  const locked = await page.evaluate(() => window.windowFixture.open('locked', false));
  await page.evaluate((instanceId) => window.windowFixture.forceClose(instanceId), locked);
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await page.evaluate(() => window.windowFixture.open('new'));
  const dialog = page.getByRole('dialog', { name: 'Окно new' });
  await dialog.waitFor();
  await page.waitForFunction(() => document.querySelector('[role="dialog"]').contains(document.activeElement));
  await page.keyboard.press('Tab');
  assert.equal(await dialog.evaluate((element) => element.contains(document.activeElement)), true);
});

test('actual page changes and reader teardown clear ownership in StrictMode', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage();
  context.after(() => page.close());
  await page.goto(`${origin}/tests/storyWindows/`);
  await page.getByTestId('open-a').click();
  const initial = await page.evaluate(() => window.windowFixture.getState().activeWindow);
  await page.evaluate(() => window.windowFixture.go('unknown-page'));
  assert.deepEqual(await page.evaluate(() => window.windowFixture.getState().activeWindow), initial);
  await page.evaluate(() => {
    window.windowFixture.open('locked', false);
    window.windowFixture.captureCallbacks();
    window.windowFixture.go('page-b');
  });
  await page.getByTestId('page-b').waitFor();
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await page.waitForFunction(() => document.activeElement === document.querySelector('#story-viewport'));
  await page.evaluate(() => window.windowFixture.lateOpen());
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.getByTestId('open-a').click();
  await page.evaluate(() => {
    window.windowFixture.open('locked', false);
    window.windowFixture.setVisible(false);
  });
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  assert.deepEqual(await page.evaluate(() => window.windowFixture.getState()), {
    sessionId: null,
    pageId: null,
    activeWindow: null,
  });
  await page.evaluate(() => window.windowFixture.setVisible(true));
  await page.getByTestId('page-a').waitFor();
  assert.equal(await page.getByRole('dialog').count(), 0);
  const owner = await page.evaluate(() => window.windowFixture.getState().sessionId);
  await page.getByTestId('open-a').click();
  await page.evaluate(() => {
    window.windowFixture.captureCallbacks();
    window.windowFixture.renew();
  });
  await page.waitForFunction((oldOwner) => window.windowFixture.getState().sessionId !== oldOwner, owner);
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await page.getByTestId('open-a').click();
  await page.evaluate(() => {
    window.windowFixture.lateClose();
    window.windowFixture.lateForceClose();
    window.windowFixture.lateOpen();
  });
  await page.getByRole('dialog', { name: 'Окно A' }).waitFor();
  assert.equal(await page.getByRole('dialog').count(), 1);
});
