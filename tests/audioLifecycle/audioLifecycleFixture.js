import assert from 'node:assert/strict';

import { openBrowserFixture } from '../browserFixture.js';

export const openAudio = async (context, { browserType, html5 = false } = {}) => {
  const { browser, origin } = await openBrowserFixture(context, browserType);
  const page = await browser.newPage();
  if (html5) {
    await page.addInitScript(() => {
      window.AudioContext = undefined;
      window.webkitAudioContext = undefined;
    });
  }

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  context.after(() => assert.deepEqual(errors, []));
  await page.goto(`${origin}/tests/audioLifecycle/index.html`);
  await page.waitForFunction(() => window.audioLifecycle?.get().state() === 'loaded');
  await page.getByRole('button', { name: 'Unlock audio' }).click();

  return page;
};
