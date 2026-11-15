import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  next,
  mode,
  openPresentation,
  previous,
  selection,
  settledSize,
} from './dialogCarouselFixture.js';
import {
  playing,
  time,
  toggleNativePlayback,
  waitPaused,
  waitPlaying,
} from '../videoPlayback/videoPlaybackFixture.js';

test('model selection changes presentation without replacing dialog, carousel, video or History', async (context) => {
  const page = await openPresentation(context);
  const dialog = page.getByRole('dialog');
  const shell = await dialog.elementHandle();
  const carousel = await dialog.getByRole('region').elementHandle();
  const video = page.getByTestId('presentation-video');
  const originalVideo = await video.elementHandle();
  const initial = await page.evaluate(() => ({ history: history.length, windows: window.presentationSnapshot() }));
  await mode(page, 'default');
  await dialog.getByRole('button', { name: 'Count 0' }).click();
  await next(page);
  await selection(page, 2);
  await mode(page, 'media');
  await next(page);
  await selection(page, 3);
  await mode(page, 'media');
  await waitPlaying(video);
  const runningPosition = await time(video);
  await dialog.getByRole('button', { name: 'Заполнить область' }).click();
  assert.equal(await playing(video), true);
  assert(await time(video) >= runningPosition - 0.05);
  await dialog.getByRole('button', { name: 'Заполнить область' }).click();
  await toggleNativePlayback(video);
  await waitPaused(video);
  const position = await time(video);
  assert(position > 0);
  await dialog.getByRole('button', { name: 'Заполнить область' }).click();
  await dialog.getByRole('button', { name: 'Развернуть окно' }).click();
  await settledSize(page, 1);
  assert.equal(await playing(video), false);
  assert(Math.abs(await time(video) - position) < 0.1);
  await page.setViewportSize({ width: 900, height: 700 });
  await settledSize(page, 1);
  await selection(page, 3);
  await dialog.getByRole('button', { name: 'Вернуть размер окна' }).click();
  await settledSize(page, 0.8);
  await selection(page, 3);
  assert.equal(await playing(video), false);
  assert(Math.abs(await time(video) - position) < 0.1);
  await previous(page);
  await selection(page, 2);
  await next(page);
  await selection(page, 3);
  assert.equal(await playing(video), false);
  assert(Math.abs(await time(video) - position) < 0.1);
  await next(page);
  await mode(page, 'default');
  assert.equal(await dialog.getByRole('button', { name: 'Заполнить область' }).count(), 0);
  assert(await shell.evaluate((element) => element === document.querySelector('[role="dialog"]')));
  assert(await carousel.evaluate((element) => {
    return element === document.querySelector('[role="dialog"] [data-book-carousel]');
  }));
  assert(await originalVideo.evaluate((element) => {
    return element === document.querySelector('[data-testid="presentation-video"]');
  }));
  const final = await page.evaluate(() => ({ history: history.length, windows: window.presentationSnapshot() }));
  assert.deepEqual(final, initial);
  await previous(page);
  await previous(page);
  await previous(page);
  await mode(page, 'default');
  await dialog.getByRole('button', { name: 'Count 1' }).waitFor();
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
  assert(await originalVideo.evaluate((element) => element.paused && element.currentTime === 0));
  await page.waitForFunction(() => document.activeElement?.textContent === 'Open gallery');
});

test('standalone model media and explicit JSX use their own classification boundary', async (context) => {
  const page = await openPresentation(context, { opener: 'Open portrait' });
  await mode(page, 'media');
  await page.getByRole('dialog').getByRole('button', { name: 'Заполнить область' }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await page.getByRole('button', { name: 'Explicit JSX', exact: true }).click();
  await mode(page, 'default');
  assert.equal(await page.getByRole('dialog').getByRole('button', { name: 'Заполнить область' }).count(), 0);
});
