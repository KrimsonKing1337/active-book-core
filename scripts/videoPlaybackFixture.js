import assert from 'node:assert/strict';

import { openBrowserFixture } from './browserFixture.js';

export const openVideos = async (context, options = {}) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 1100, height: 850 }, ...options.page });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  context.after(async () => {
    await page.close();
    assert.deepEqual(errors, []);
  });
  if (options.setup) {
    await options.setup(page);
  }

  await page.goto(`${origin}/tests/videoPlayback/?${options.search ?? ''}`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('page-a').waitFor();

  return page;
};

export const playing = (video) => video.evaluate((element) => !element.paused);

export const waitPlaying = async (video) => {
  const element = await video.elementHandle();
  assert(element);
  await video.page().waitForFunction((element) => {
    return !element.paused && element.currentTime > 0.2;
  }, element);
};

export const waitPaused = async (video) => {
  const element = await video.elementHandle();
  assert(element);
  await video.page().waitForFunction((element) => element.paused, element);
};

export const time = (video) => video.evaluate((element) => element.currentTime);

export const toggleNativePlayback = async (video) => {
  await video.hover();
  const box = await video.boundingBox();
  assert(box);
  const position = { x: 24, y: box.height - 48 };

  if (await video.page().evaluate(() => navigator.maxTouchPoints > 0)) {
    await video.tap({ position });
  } else {
    await video.click({ position });
  }
};

export const holdVideo = async (page, pattern) => {
  let resolveRoute;
  const request = new Promise((resolve) => {
    resolveRoute = resolve;
  });
  await page.route(pattern, (route) => resolveRoute(route));

  return { request };
};
