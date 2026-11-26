import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

import { openBrowserFixture } from '../browserFixture.js';

const effect = (page, id) => page.locator(`[data-effect-id="${id}"]`);
const navigate = async (page, number) => {
  await page.evaluate((number) => window.realVisual.goToPage(number), number);
  await page.getByText(`Страница ${number}`, { exact: true }).waitFor();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
};

test('real Background and Frame renderers use the book session in Chromium', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  for (const mode of process.env.CAPTURE_VISUAL_BASELINE === '1' ? [] : ['reader', 'editor']) {
    await context.test(`page/range continuity and resources (${mode})`, async () => {
      const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
      const errors = [];
      let mediaRequests = 0;
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (request) => {
        if (/range-pattern.svg|movie.webm/.test(request.url())) mediaRequests += 1;
      });
      await page.goto(`${origin}/tests/unifiedVisualEffects/?mode=${mode}`);
      await page.waitForFunction(() => !!window.realVisual);
      await navigate(page, 1);
      await effect(page, 'range-frame').waitFor();
      await page.waitForFunction(() => {
        const video = document.querySelector('[data-effect-id="range-video"] video');
        return video?.readyState >= 2 && video.currentTime > 0.2;
      });
      const playingVideo = await effect(page, 'range-video').locator('video').elementHandle();
      const timeBeforeVolume = await playingVideo.evaluate((element) => element.currentTime);
      await page.evaluate(() => window.realVisual.setVolume(50, 40));
      await page.waitForFunction(() => Math.abs(document.querySelector('[data-effect-id="range-video"] video').volume - 0.2) < 0.001);
      await page.evaluate(() => window.realVisual.effects.update('range-video', { effect: { params: {
        kind: 'video', video: { id: 'range-movie', src: '/tests/unifiedVisualEffects/movie.webm', autoPlay: true, relativeVolume: 50 },
      } } }));
      await page.waitForFunction(() => Math.abs(document.querySelector('[data-effect-id="range-video"] video').volume - 0.1) < 0.001);
      assert(await playingVideo.evaluate((element) => element === document.querySelector('[data-effect-id="range-video"] video')));
      assert(await playingVideo.evaluate((element, before) => element.currentTime >= before && !element.paused, timeBeforeVolume));
      await page.evaluate(() => window.realVisual.setVolume(100, 100));
      const book = await page.locator('[data-story-region="story"]').elementHandle();
      const counter = await page.getByTestId('range-frame-state').elementHandle();
      const firstToken = await counter.getAttribute('data-instance');
      const image = await effect(page, 'range-image').locator('img').elementHandle();
      const video = await effect(page, 'range-video').locator('video').elementHandle();
      const pageShadow = await effect(page, 'page-shadow-1').elementHandle();
      await effect(page, 'range-pulse').evaluate((element) => {
        window.heldRealAnimation = element.getAnimations({ subtree: true })[0];
        window.heldPresetAnimations = ['pulse', 'police', 'caramel'].map((preset) => {
          return document.querySelector(`[data-effect-id="range-${preset}"]`).getAnimations({ subtree: true })[0];
        });
      });
      const requestsAtStart = mediaRequests;
      const mountsAtStart = await page.evaluate(() => window.realVisualMetrics.mounts);
      for (const selectedId of ['range-frame', 'range-pulse', null]) {
        await page.evaluate((id) => window.setSelectedRealVisualEffect(id), selectedId);
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
        assert.equal(await page.locator('[data-visual-selection]').count(), mode === 'editor' && selectedId ? 1 : 0);
        assert.equal(await page.getByTestId('range-frame-state').getAttribute('data-instance'), firstToken);
        assert.equal(await page.evaluate(() => window.realVisualMetrics.mounts), mountsAtStart);
        assert(await effect(page, 'range-pulse').evaluate((element) => {
          return element.getAnimations({ subtree: true })[0] === window.heldRealAnimation;
        }), 'selection preserves the running animation');
      }
      await page.evaluate(() => window.dispatchEvent(new Event('increment-visual')));
      await page.getByTestId('range-frame-state').filter({ hasText: '1' }).waitFor();

      for (const number of [2, 4, 1]) {
        await navigate(page, number);
        assert.equal(await page.getByTestId('range-frame-state').getAttribute('data-instance'), firstToken);
        assert.equal(await page.getByTestId('range-frame-state').textContent(), '1');
        assert.equal(await page.getByTestId('range-background-state').textContent(), '1');
        assert(await image.evaluate((element) => element === document.querySelector('[data-effect-id="range-image"] img')));
        assert(await video.evaluate((element) => element === document.querySelector('[data-effect-id="range-video"] video')));
        assert(await effect(page, 'range-pulse').evaluate((element) => {
          return ['pulse', 'police', 'caramel'].every((preset, index) => {
            return document.querySelector(`[data-effect-id="range-${preset}"]`).getAnimations({ subtree: true })[0]
              === window.heldPresetAnimations[index];
          });
        }));
        assert.equal(mediaRequests, requestsAtStart, 'range media is not fetched again');
        assert.equal(await page.evaluate(() => window.realVisualMetrics.mounts), mountsAtStart);
      }
      assert.equal(await pageShadow.evaluate((element) => element.isConnected), false, 'page effect was destroyed');
      assert(await book.evaluate((element) => element === document.querySelector('[data-story-region="story"]')));

      const frame = await effect(page, 'range-frame').elementHandle();
      await page.evaluate(() => {
        const session = window.realVisual.effects;
        session.update('range-frame', {
          effect: {
            visibility: { sides: ['top', 'right'] },
            depth: { plane: 'belowNarrative', order: 20 },
            placement: {
              ...session.getSnapshot().find((cur) => cur.effect.id === 'range-frame').effect.placement,
              offset: { x: { value: 2, unit: 'px' }, y: { value: 1, unit: 'px' } },
            },
          },
        });
        session.update('range-pulse', { effect: { params: {
          kind: 'shadow', shadow: { id: 'pulse', sides: ['left', 'right'], thickness: 80,
            style: { color: '#4fc3ff' }, animation: { preset: 'pulse', duration: 2000 } },
        } } });
      });
      await page.setViewportSize({ width: 820, height: 700 });
      await page.locator('#narrative').evaluate((element) => { element.scrollTop = 300; });
      assert(await frame.evaluate((element) => element === document.querySelector('[data-effect-id="range-frame"]')));
      assert.equal(await page.getByTestId('range-frame-state').getAttribute('data-instance'), firstToken);
      assert(await effect(page, 'range-pulse').evaluate((element) => {
        return element.getAnimations({ subtree: true })[0] === window.heldRealAnimation;
      }));
      await page.evaluate(() => window.setRealPageCount(6));
      await page.getByText('1 из 6', { exact: true }).waitFor();
      assert.equal(await page.getByTestId('range-frame-state').getAttribute('data-instance'), firstToken);

      const playedTime = await video.evaluate((element) => element.currentTime);
      await navigate(page, 3);
      assert.equal(await effect(page, 'range-frame').count(), 0);
      assert.equal(await video.evaluate((element) => element.isConnected), false);
      assert.equal(await image.evaluate((element) => element.isConnected), false);
      assert.equal(await video.evaluate((element) => element.paused && !element.getAttribute('src')), true);
      assert.equal(await page.evaluate(() => window.realVisual.effects.getController('range-frame')), undefined);
      await navigate(page, 4);
      assert.notEqual(await page.getByTestId('range-frame-state').getAttribute('data-instance'), firstToken);
      assert.equal(await page.getByTestId('range-frame-state').textContent(), '0');
      assert.equal(await video.evaluate((element) => element === document.querySelector('[data-effect-id="range-video"] video')), false);
      assert(await effect(page, 'range-video').locator('video').evaluate((element, previous) => {
        return element.currentTime < previous;
      }, playedTime), 'reentry starts a fresh video');
      await navigate(page, 1);
      await page.evaluate(() => window.setRealPageCount(1));
      await page.getByText('1 из 1', { exact: true }).waitFor();
      await page.evaluate(() => window.realVisual.goToPage(2));
      await page.getByText('1 из 1', { exact: true }).waitFor();
      assert.equal(await effect(page, 'page-shadow-2').count(), 0, 'unknown page IDs are ignored');
      await page.evaluate(() => window.setRealPageCount(2));
      await page.getByText('1 из 2', { exact: true }).waitFor();
      await navigate(page, 2);
      await effect(page, 'page-shadow-2').waitFor();
      await page.getByText('2 из 2', { exact: true }).waitFor();
      assert.deepEqual(errors, []);
      await page.close();
    });
  }

  await context.test('real static effects match the reviewed storyViewport screenshot', async (snapshotContext) => {
    if (process.platform !== 'linux') {
      snapshotContext.skip('The reviewed static screenshot reference is Linux-specific');
      return;
    }
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    await page.goto(`${origin}/tests/unifiedVisualEffects/?compat`);
    await page.getByTestId('first').click();
    await effect(page, 'page-mask-1').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    // Keep the fixture's unlock diagnostic fixed in the visual reference.
    await page.getByTestId('audio-unlocked').evaluate((output) => { output.textContent = 'false'; });
    const actual = await page.screenshot();
    const path = new URL('./screenshots/static-chromium-linux.png', import.meta.url);
    if (process.env.CAPTURE_VISUAL_BASELINE === '1') {
      await mkdir(new URL('./screenshots/', import.meta.url), { recursive: true });
      await page.screenshot({ path: fileURLToPath(path) });
    } else {
      const expected = PNG.sync.read(await readFile(path));
      const result = PNG.sync.read(actual);
      assert.equal(result.width, expected.width);
      assert.equal(result.height, expected.height);
      let changedPixels = 0;
      for (let i = 0; i < result.data.length; i += 4) {
        if ([0, 1, 2].some((channel) => Math.abs(result.data[i + channel] - expected.data[i + channel]) > 4)) changedPixels += 1;
      }
      assert(changedPixels < 100, `visual regression: ${changedPixels} pixels changed`);
    }
    await page.close();
  });
});
