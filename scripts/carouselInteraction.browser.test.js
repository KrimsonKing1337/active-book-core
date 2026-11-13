import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  mouseDrag,
  openCarousel,
  selections,
  touchSwipe,
  waitIndices,
} from './carouselFixture.js';

test('native touch changes only the carousel; a background swipe still advances the reader', async (context) => {
  const page = await openCarousel(context, {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await touchSwipe(page, page.getByTestId('drag-a'));
  await waitIndices(page, [0, 1]);
  assert.equal(await page.getByTestId('next-page').count(), 0);
  await page.getByRole('button', { name: 'Следующий слайд' }).click();
  await page.getByText('3 из 3', { exact: true }).waitFor();
  await touchSwipe(page, page.getByTestId('drag-c'));
  assert.equal(await page.getByTestId('next-page').count(), 0);
  await touchSwipe(page, page.getByTestId('reader-background'));
  await page.getByTestId('next-page').waitFor();
});

test('native video controls keep mouse, keyboard and touch gestures', async (context) => {
  const page = await openCarousel(context, { hasTouch: true });
  await page.evaluate(() => window.carouselFixture.setSlides(['video', 'b']));
  const video = page.getByTestId('native-video');
  await video.waitFor();
  await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
  await video.focus();
  await video.press('Space');
  await page.waitForFunction(() => !document.querySelector('video').paused);
  await video.press('ArrowRight');
  await mouseDrag(page, video);
  await touchSwipe(page, video);
  assert.deepEqual(await selections(page), [{ index: 0, version: 0 }]);
  assert.equal(await page.getByTestId('next-page').count(), 0);
  await video.evaluate((element) => {
    element.controls = false;
  });
  await mouseDrag(page, video);
  await waitIndices(page, [0, 1]);
});
