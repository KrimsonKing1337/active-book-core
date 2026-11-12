import assert from 'node:assert/strict';
import { test } from 'node:test';

import { near, openBrowserFixture } from './browserFixture.js';

const preferenceKey = 'active-book:dialog-preferences';

const assertGeometry = async (page, expected) => {
  const viewport = await page.getByTestId('viewport').boundingBox();
  const dialog = await page.getByRole('dialog').boundingBox();

  assert(viewport && dialog);
  near(dialog.width, viewport.width * expected.width / 100, 'width relative to story viewport');
  near(dialog.height, viewport.height * expected.height / 100, 'height relative to story viewport');
  near(dialog.x, viewport.x + (viewport.width - dialog.width) / 2, 'centered horizontally');
  near(dialog.y, viewport.y + (viewport.height - dialog.height) / 2, 'centered vertically');
};

test('Dialog preserves dimensions, preferences and focus in reader and preview', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);

  for (const mode of ['reader', 'editor']) {
    await context.test(mode, async () => {
      const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
      context.after(() => page.close());
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      if (mode === 'editor') {
        await page.addInitScript((key) => {
          localStorage.setItem(key, JSON.stringify({ isFullscreen: true, objectFit: 'cover' }));
        }, preferenceKey);
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${origin}/tests/storyDialog/?mode=${mode}`);
      await page.getByTestId('open').click();
      const dialog = page.getByRole('dialog', { name: 'Окно истории' });
      await dialog.waitFor();
      await assertGeometry(page, { width: 60, height: 70 });

      assert.equal(await dialog.getAttribute('aria-modal'), 'true');
      assert.equal(await dialog.evaluate((element) => element.contains(document.activeElement)), true);
      for (let index = 0; index < 7; index += 1) {
        await page.keyboard.press('Tab');
        assert.equal(await dialog.evaluate((element) => element.contains(document.activeElement)), true);
      }
      await page.keyboard.press('Shift+Tab');
      assert.equal(await dialog.evaluate((element) => element.contains(document.activeElement)), true);

      await dialog.getByRole('button', { name: 'Заполнить область' }).click();
      assert.equal(await dialog.getByRole('img').evaluate((element) => getComputedStyle(element).objectFit), 'cover');
      await dialog.getByRole('button', { name: 'Развернуть окно' }).click();
      await assertGeometry(page, { width: 100, height: 100 });
      const originalDialog = await dialog.elementHandle();

      await page.evaluate(() => window.dialogFixture.setMode('default'));
      assert.equal(await dialog.getAttribute('data-mode'), 'default');
      assert.equal(await dialog.getByRole('button', { name: 'Заполнить область' }).count(), 0);
      await assertGeometry(page, { width: 100, height: 100 });
      await page.evaluate(() => window.dialogFixture.setMode('media'));
      assert.equal(await dialog.getAttribute('data-object-fit'), 'cover');
      const remainsMounted = await originalDialog.evaluate((element) => {
        return element === document.querySelector('[role="dialog"]');
      });
      assert.equal(remainsMounted, true);

      await dialog.getByRole('button', { name: 'Вернуть размер окна' }).click();
      await assertGeometry(page, { width: 60, height: 70 });
      if (mode === 'editor') {
        const saved = await page.evaluate((key) => localStorage.getItem(key), preferenceKey);
        assert.deepEqual(JSON.parse(saved), { isFullscreen: true, objectFit: 'cover' });
      }
      await page.evaluate(() => window.dialogFixture.setMode('default'));
      await assertGeometry(page, { width: 60, height: 70 });
      await dialog.getByRole('button', { name: 'Развернуть окно' }).click();
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'detached' });
      await page.waitForFunction(() => document.activeElement === document.querySelector('[data-testid="open"]'));

      const stored = await page.evaluate((key) => localStorage.getItem(key), preferenceKey);
      if (mode === 'reader') {
        assert.deepEqual(JSON.parse(stored), { isFullscreen: true, objectFit: 'cover' });
      } else {
        assert.deepEqual(JSON.parse(stored), { isFullscreen: true, objectFit: 'cover' },
          'editor preview does not overwrite reader preferences');
      }

      await page.evaluate(() => {
        window.dialogFixture.setMounted(false);
      });
      await page.evaluate(() => window.dialogFixture.setMounted(true));
      await page.getByTestId('open').click();
      await dialog.waitFor();
      if (mode === 'reader') {
        await assertGeometry(page, { width: 100, height: 100 });
        assert.equal(await dialog.getAttribute('data-object-fit'), 'cover');
      } else {
        await assertGeometry(page, { width: 60, height: 70 });
        await page.evaluate(() => window.dialogFixture.setSize({ width: 480, height: 320 }));
        await assertGeometry(page, { width: 60, height: 70 });
      }

      await page.evaluate(() => window.dialogFixture.setCanClose(false));
      await page.keyboard.press('Escape');
      assert.equal(await dialog.count(), 1);
      assert.equal(await dialog.getByRole('button', { name: 'Закрыть', exact: true }).count(), 0);
      await page.evaluate(() => window.dialogFixture.setOpen(false));
      await dialog.waitFor({ state: 'detached' });
      await page.waitForFunction(() => document.body.style.pointerEvents !== 'none');
      assert.deepEqual(errors, []);
    });
  }
});

test('default geometry is 75 percent and the layer is above visual content', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  context.after(() => page.close());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${origin}/tests/storyDialog/?mode=editor&defaults=true`);
  await page.getByTestId('open').click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await assertGeometry(page, { width: 75, height: 75 });
  assert.equal(await dialog.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return element.contains(hit) && !element.closest('[inert]');
  }), true);
  await page.evaluate(() => window.dialogFixture.setMode('default'));
  await assertGeometry(page, { width: 75, height: 75 });
  await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  await page.waitForFunction(() => document.body.style.pointerEvents !== 'none');
});

test('denied storage, outside dismissal, mobile resize and missing portal container', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 390, height: 720 } });
  context.after(() => page.close());
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage denied', 'SecurityError');
      },
    });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${origin}/tests/storyDialog/`);
  await page.getByTestId('open').click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await assertGeometry(page, { width: 60, height: 70 });
  await dialog.getByRole('button', { name: 'Развернуть окно' }).click();
  await page.setViewportSize({ width: 720, height: 390 });
  await assertGeometry(page, { width: 100, height: 100 });
  await dialog.getByRole('button', { name: 'Вернуть размер окна' }).click();
  await page.evaluate(() => window.dialogFixture.setCanClose(false));
  await page.mouse.click(2, 2);
  assert.equal(await dialog.count(), 1);
  await page.evaluate(() => window.dialogFixture.setCanClose(true));
  await page.mouse.click(2, 2);
  await dialog.waitFor({ state: 'detached' });
  await page.waitForFunction(() => document.body.style.pointerEvents !== 'none');
  await page.evaluate(() => {
    window.dialogFixture.setContainer(null);
    window.dialogFixture.setOpen(true);
  });
  assert.equal(await dialog.count(), 0, 'missing story viewport never falls back to document.body');
  assert.equal(await page.locator('[data-story-dialog-layer]').count(), 0);
});
