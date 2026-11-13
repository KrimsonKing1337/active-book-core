import assert from 'node:assert/strict';

import { openBrowserFixture } from './browserFixture.js';

export const openCarousel = async (context, options = {}) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 1100, height: 850 }, ...options });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  context.after(async () => {
    await page.close();
    assert.deepEqual(errors, []);
  });
  await page.goto(`${origin}/tests/carousel/`);
  await page.getByText('1 из 3', { exact: true }).waitFor();
  await waitIndices(page, [0]);

  return page;
};

export const selections = (page) => page.getByTestId('selections').evaluate((element) => {
  return JSON.parse(element.textContent);
});

export const waitIndices = (page, expected) => page.waitForFunction((expected) => {
  const element = document.querySelector('[data-testid="selections"]');
  const indices = JSON.parse(element.textContent).map((selection) => selection.index);

  return JSON.stringify(indices) === JSON.stringify(expected);
}, expected);

export const mouseDrag = async (page, target) => {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  assert(box);
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.85, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.15, y, { steps: 12 });
  await page.mouse.up();
};

export const touchSwipe = async (page, target) => {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  assert(box);
  const session = await page.context().newCDPSession(page);
  const point = { x: box.x + box.width * 0.85, y: box.y + box.height / 2 };
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });

  for (let step = 1; step <= 5; step += 1) {
    point.x = box.x + box.width * (0.85 - step * 0.14);
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
  }

  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
};
