import assert from 'node:assert/strict';
import { test } from 'node:test';

import { near, openBrowserFixture } from './browserFixture.js';

const boxes = (page) => page.evaluate(() => {
  const viewport = document.querySelector('[data-testid="viewport"]').getBoundingClientRect();
  const outline = document.querySelector('[data-visual-selection]').getBoundingClientRect();

  return {
    viewport: {
      x: viewport.x,
      y: viewport.y,
      width: viewport.width,
      height: viewport.height,
    },
    outline: {
      x: outline.x,
      y: outline.y,
      width: outline.width,
      height: outline.height,
    },
  };
});

const assertAligned = async (page) => {
  const { viewport, outline } = await boxes(page);

  for (const axis of [
    'x',
    'y',
    'width',
    'height',
  ]) {
    near(outline[axis], viewport[axis], axis);
  }
};

const openOutline = async (context, search = '') => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const windowErrors = [];
  await page.exposeFunction('recordOutlineError', (message) => windowErrors.push(message));
  await page.addInitScript(() => {
    window.addEventListener('error', (event) => void window.recordOutlineError(event.message));
  });
  context.after(async () => {
    assert.deepEqual(errors, []);
    assert.deepEqual(windowErrors, []);
    await page.close();
  });
  await page.goto(`${origin}/tests/selectionOutline/?${search}`);
  await page.locator('[data-visual-selection]').waitFor();

  return page;
};

test('clipping follows narrative viewport height even if selected content and root do not resize', async (context) => {
  const page = await openOutline(context);
  await assertAligned(page);
  await page.getByRole('button', { name: 'Resize narrative viewport' }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="viewport"]').clientHeight === 140);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await assertAligned(page);
});

test('preview resize, real scroll and selected region changes retain the visible outline', async (context) => {
  const page = await openOutline(context);
  await page.getByRole('button', { name: 'Resize preview' }).click();
  await page.waitForFunction(() => {
    return document.querySelector('[data-visual-selection]').getBoundingClientRect().width < 400;
  });
  await assertAligned(page);
  await page.getByTestId('viewport').hover();
  await page.mouse.wheel(0, 100);
  await page.waitForFunction(() => document.querySelector('[data-testid="viewport"]').scrollTop > 0);
  await assertAligned(page);
  await page.getByRole('button', { name: 'Select viewport' }).click();
  await assertAligned(page);
});

test('an initially scaled embed uses local CSS coordinates rather than applying scale twice', async (context) => {
  const page = await openOutline(context, 'scale=0.75');
  await assertAligned(page);
});

test('new selection snapshots refresh position and radius without a size change', async (context) => {
  const page = await openOutline(context);
  await page.getByRole('button', { name: 'Move region without resizing' }).click();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await assertAligned(page);
  assert.equal(await page.locator('[data-visual-selection]').evaluate((element) => {
    return getComputedStyle(element).borderRadius;
  }), '20px');
});
