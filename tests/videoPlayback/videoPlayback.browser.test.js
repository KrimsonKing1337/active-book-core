import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  openVideos,
  playing,
  time,
  toggleNativePlayback,
  waitPaused,
  waitPlaying,
} from './videoPlaybackFixture.js';

test('only the active video in a page carousel plays after reader readiness', async (context) => {
  const page = await openVideos(context);
  await page.waitForFunction(() => {
    const video = document.querySelector('[data-testid="page-a"]');

    return !video.paused && video.currentTime > 0.2;
  });
  assert.equal(await playing(page.getByTestId('page-b')), false);
});

test('A to B to A preserves DOM position and resumes only playing intent', async (context) => {
  const page = await openVideos(context);
  const gallery = page.getByTestId('page-gallery');
  const first = page.getByTestId('page-a');
  const original = await first.elementHandle();
  await waitPlaying(first);
  const historyLength = await page.evaluate(() => history.length);
  await gallery.getByRole('button', { name: 'Следующий слайд' }).click();
  await waitPaused(first);
  const pausedTime = await time(first);
  assert(pausedTime > 0);
  await waitPlaying(page.getByTestId('page-b'));
  assert.equal(await time(first), pausedTime);
  await gallery.getByRole('button', { name: 'Предыдущий слайд' }).click();
  await waitPlaying(first);
  assert(await original.evaluate((node) => node === document.querySelector('[data-testid="page-a"]')));
  assert.equal(await playing(page.getByTestId('page-b')), false);
  assert.equal(await page.evaluate(() => history.length), historyLength);

  await toggleNativePlayback(first);
  await waitPaused(first);
  const manualTime = await time(first);
  await gallery.getByRole('button', { name: 'Следующий слайд' }).click();
  await waitPlaying(page.getByTestId('page-b'));
  await gallery.getByRole('button', { name: 'Предыдущий слайд' }).click();
  await gallery.getByText('1 из 2', { exact: true }).waitFor();
  assert.equal(await playing(first), false);
  assert.equal(await time(first), manualTime);
});

test('autoPlay=false requires native user play and remembers it when returning', async (context) => {
  const page = await openVideos(context, { search: 'autoplay=false' });
  const first = page.getByTestId('page-a');
  const second = page.getByTestId('page-b');
  await waitPlaying(page.getByTestId('outside'));
  assert.equal(await playing(first), false);
  assert.equal(await playing(second), false);
  await toggleNativePlayback(first);
  await waitPlaying(first);
  const gallery = page.getByTestId('page-gallery');
  await gallery.getByRole('button', { name: 'Следующий слайд' }).click();
  await gallery.getByText('2 из 2', { exact: true }).waitFor();
  assert.equal(await playing(first), false);
  assert.equal(await playing(second), false);
  await gallery.getByRole('button', { name: 'Предыдущий слайд' }).click();
  await waitPlaying(first);
});

test('resize and rerender keep manual pause and position; page exit stops every video', async (context) => {
  const page = await openVideos(context);
  const first = page.getByTestId('page-a');
  const outside = page.getByTestId('outside');
  await waitPlaying(first);
  await waitPlaying(outside);
  assert.equal(await outside.getAttribute('data-autoplay'), 'true');
  assert.equal(await first.getAttribute('data-autoplay'), 'false');
  await toggleNativePlayback(first);
  await waitPaused(first);
  const position = await time(first);
  await page.evaluate(() => {
    window.videoFixture.resize();
    window.videoFixture.rerender();
  });
  await page.getByTestId('revision').filter({ hasText: '1' }).waitFor();
  assert.equal(await playing(first), false);
  assert.equal(await time(first), position);
  const oldFirst = await first.elementHandle();
  const oldOutside = await outside.elementHandle();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await page.getByTestId('next-page').waitFor();
  assert(await oldFirst.evaluate((element) => element.paused));
  assert(await oldOutside.evaluate((element) => element.paused));
});

test('page navigation keeps a matching cached ID without mutating frozen Redux state', async (context) => {
  const page = await openVideos(context, { search: 'time-cache' });
  const first = page.getByTestId('outside');
  await waitPlaying(first);
  await first.evaluate((video) => {
    video.pause();
    video.currentTime = 1.25;
    video.dispatchEvent(new Event('timeupdate'));
  });
  await page.evaluate(async () => {
    const { store } = await import('/src/store/index.ts');
    const { effectsActions } = await import('/src/store/effects/common/index.ts');
    store.dispatch(effectsActions.setVideosCurrentTime({ outside: 1.25, absent: 3 }));
  });
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await page.getByTestId('next-page').waitFor();
  const restored = page.getByTestId('restored-outside');
  await page.waitForFunction(() => document.querySelector('[data-testid="restored-outside"]').currentTime >= 1.2);
  assert(Math.abs(await time(restored) - 1.25) < 0.05);
  assert.equal(await playing(restored), false);
  const saved = await page.evaluate(async () => {
    const { store } = await import('/src/store/index.ts');

    return store.getState().effects.videosCurrentTime;
  });
  assert.deepEqual(saved, { outside: 1.25 });
});
