import assert from 'node:assert/strict';

import { openBrowserFixture } from './browserFixture.js';

export const openDialogs = async (context, options = {}) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 1100, height: 850 }, ...options.page });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  context.after(async () => {
    await page.close();
    assert.deepEqual(errors, []);
  });
  await page.goto(`${origin}/tests/readerDialogs/?${options.search ?? ''}`);
  await page.locator('#story-viewport').waitFor();

  return { page, origin };
};

export const waitPosition = (page, position) => page.waitForFunction((position) => {
  return history.state?.activeBookWindows?.position === position;
}, position);

export const travel = (page, delta) => page.evaluate((delta) => new Promise((resolve) => {
  addEventListener('popstate', () => resolve(), { once: true });
  history.go(delta);
}), delta);

export const clickOutside = async (page) => {
  const box = await page.locator('#story-viewport').boundingBox();
  assert.ok(box);
  await page.mouse.click(box.x + 2, box.y + 2);
};
