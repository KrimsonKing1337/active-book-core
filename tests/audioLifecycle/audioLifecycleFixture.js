import assert from 'node:assert/strict';

import { openBrowserFixture } from '../browserFixture.js';

export const openAudio = async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  context.after(() => assert.deepEqual(errors, []));
  await page.goto(`${origin}/tests/audioLifecycle/index.html`);
  await page.waitForFunction(() => window.audioLifecycle?.get().state() === 'loaded');
  await page.getByRole('button', { name: 'Unlock audio' }).click();

  return page;
};
