import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openBrowserFixture } from '../browserFixture.js';

for (const mode of ['reader', 'editor']) {
  test(`delayed media preserves CSS Animation and Canvas identity through the loader in ${mode}`, async (context) => {
    const { browser, origin } = await openBrowserFixture(context);
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    context.after(() => page.close());
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    context.after(() => release());
    await page.route('**/delayed-story.svg', async (route) => {
      await gate;
      await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="red"/></svg>' });
    });
    await page.goto(`${origin}/tests/mediaContinuity/?mode=${mode}`);
    await page.locator('[data-css-range]').waitFor();
    await page.evaluate(() => {
      const node = document.querySelector('[data-css-range]');
      const animation = node.getAnimations().find((cur) => cur instanceof CSSAnimation);
      const canvas = node.querySelector('canvas');
      window.mediaIdentity = { node, animation, canvas, context: canvas.getContext('2d'), time: animation.currentTime };
    });
    await page.getByTestId('next').click();
    await page.waitForFunction(async () => (await import('/src/store/index.ts')).store.getState().main.showLoader);
    await page.waitForTimeout(350);
    assert(await page.evaluate(() => {
      const old = window.mediaIdentity;
      return old.node.isConnected && old.node.getAnimations().includes(old.animation)
        && old.animation.currentTime > old.time + 300 && old.canvas.getContext('2d') === old.context;
    }));
    assert.equal(await page.getByTestId('new-content').isVisible(), mode === 'editor');
    release();
    await page.locator('[data-story-content][aria-busy="false"]').waitFor();
    await page.getByTestId('new-content').waitFor();
    assert(await page.evaluate(() => {
      const old = window.mediaIdentity;
      return old.node === document.querySelector('[data-css-range]') && old.node.getAnimations().includes(old.animation)
        && old.canvas.isConnected && old.context.getImageData(0, 0, 1, 1).data[1] === 221;
    }));
  });
}
