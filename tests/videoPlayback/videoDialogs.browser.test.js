import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  openVideos,
  playing,
  toggleNativePlayback,
  waitPaused,
  waitPlaying,
} from './videoPlaybackFixture.js';

test('mobile dialog preserves slide intent, resets on close and starts a new cycle on reopen', async (context) => {
  const page = await openVideos(context, { page: { viewport: { width: 390, height: 844 }, hasTouch: true } });
  const trigger = page.getByRole('button', { name: 'Video gallery', exact: true });
  await trigger.click();
  let dialog = page.getByRole('dialog', { name: 'Video gallery', exact: true });
  const first = page.getByTestId('dialog-a');
  const second = page.getByTestId('dialog-b');
  await waitPlaying(first);
  assert.equal(await playing(second), false);
  const historyLength = await page.evaluate(() => history.length);
  await dialog.getByRole('button', { name: 'Следующий слайд' }).click();
  await waitPlaying(second);
  assert.equal(await playing(first), false);
  await dialog.getByRole('button', { name: 'Предыдущий слайд' }).click();
  await waitPlaying(first);
  await toggleNativePlayback(first);
  await waitPaused(first);
  await dialog.getByRole('button', { name: 'Следующий слайд' }).click();
  await waitPlaying(second);
  await dialog.getByRole('button', { name: 'Предыдущий слайд' }).click();
  await dialog.getByText('1 из 2', { exact: true }).waitFor();
  assert.equal(await playing(first), false);
  assert.equal(await page.evaluate(() => history.length), historyLength);
  const oldVideos = await dialog.locator('video').elementHandles();
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });

  for (const video of oldVideos) {
    assert(await video.evaluate((element) => element.paused && element.currentTime === 0));
  }

  await trigger.click();
  dialog = page.getByRole('dialog', { name: 'Video gallery', exact: true });
  await dialog.getByText('1 из 2', { exact: true }).waitFor();
  await waitPlaying(page.getByTestId('dialog-a'));
  assert.equal(await playing(page.getByTestId('dialog-b')), false);
});

test('dialog replacement stops and resets all retired videos before the new window plays', async (context) => {
  const page = await openVideos(context);
  await page.getByRole('button', { name: 'Video gallery', exact: true }).click();
  const first = page.getByRole('dialog', { name: 'Video gallery', exact: true });
  await waitPlaying(page.getByTestId('dialog-a'));
  const oldVideos = await first.locator('video').elementHandles();
  await first.getByRole('button', { name: 'Replace dialog' }).click();
  await page.getByRole('dialog', { name: 'Other dialog', exact: true }).waitFor();
  await waitPlaying(page.getByTestId('other'));

  for (const video of oldVideos) {
    assert(await video.evaluate((element) => element.paused && element.currentTime === 0));
  }
});

test('standalone native video retains dialog autoplay; native carousel video is not force-started', async (context) => {
  const page = await openVideos(context);
  await page.getByRole('button', { name: 'Native dialog', exact: true }).click();
  const native = page.getByTestId('native-dialog');
  await waitPlaying(native);
  const oldNative = await native.elementHandle();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  assert(await oldNative.evaluate((element) => element.paused && element.currentTime === 0));
  await page.getByRole('button', { name: 'Native carousel', exact: true }).click();
  await page.getByTestId('native-b').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('[data-testid="native-b"]').readyState >= 2);
  assert.equal(await playing(page.getByTestId('native-a')), false);
  assert.equal(await playing(page.getByTestId('native-b')), false);
});
