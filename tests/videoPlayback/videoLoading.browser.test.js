import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  holdVideo,
  openVideos,
  playing,
  waitPlaying,
} from './videoPlaybackFixture.js';

test('switching during media loading does not revive the inactive video', async (context) => {
  const page = await openVideos(context);
  const held = await holdVideo(page, '**/movie.webm?id=page-a&source=second');
  await page.evaluate(() => window.videoFixture.changeSource());
  const request = await held.request;
  const gallery = page.getByTestId('page-gallery');
  await gallery.getByRole('button', { name: 'Следующий слайд' }).click();
  await waitPlaying(page.getByTestId('page-b'));
  await request.continue();
  await page.waitForFunction(() => document.querySelector('[data-testid="page-a"]').readyState >= 2);
  assert.equal(await playing(page.getByTestId('page-a')), false);
  await gallery.getByRole('button', { name: 'Предыдущий слайд' }).click();
  await waitPlaying(page.getByTestId('page-a'));
});

test('closing a dialog during media loading cancels its playback cycle', async (context) => {
  const page = await openVideos(context);
  const held = await holdVideo(page, '**/movie.webm?id=dialog-a&source=first');
  await page.getByRole('button', { name: 'Video gallery', exact: true }).click();
  const request = await held.request;
  const oldVideo = await page.getByTestId('dialog-a').elementHandle();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await request.continue();
  assert(await oldVideo.evaluate((element) => element.paused && element.currentTime === 0));
  assert(await oldVideo.evaluate((element) => !element.hasAttribute('src')));
  await page.getByRole('button', { name: 'Other dialog', exact: true }).click();
  await waitPlaying(page.getByTestId('other'));
  assert(await oldVideo.evaluate((element) => element.paused));
});

test('source replacement during loading ignores the retired response', async (context) => {
  let held;
  const page = await openVideos(context, {
    preparing: true,
    setup: async (page) => {
      held = await holdVideo(page, '**/movie.webm?id=page-a&source=first');
    },
  });
  const request = await held.request;
  const first = await page.getByTestId('page-a').elementHandle();
  await page.evaluate(() => window.videoFixture.changeSource());
  await waitPlaying(page.getByTestId('page-a'));
  await request.continue();
  assert(await first.evaluate((element) => element.getAttribute('src').includes('source=second')));
  assert(await first.evaluate((element) => !element.paused));
  assert.equal(await playing(page.getByTestId('page-b')), false);
});
