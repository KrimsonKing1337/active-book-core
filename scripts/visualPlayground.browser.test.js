import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { test } from 'node:test';

import { near, openBrowserFixture, pixels } from './browserFixture.js';

const settle = (page) => page.evaluate(() => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}));
const patch = async (page, settings) => {
  await page.evaluate((settings) => window.playground.change(settings), settings);
  await settle(page);
};
const bounds = (page, selector) => page.locator(selector).boundingBox();
const frameToken = (page) => page.locator('[data-demo-effect="frame"]').getAttribute('data-token');
const currentRun = (page, id) => page.evaluate((id) => window.playground.session.runs.read(id), id);
const waitRun = (page, id, status = 'completed', afterRun = 0) => page.waitForFunction(({ id, status, afterRun }) => {
  const run = window.playground.session.runs.read(id);
  return run?.status === status && run.number > afterRun;
}, { id, status, afterRun });
const play = (page) => page.getByTestId('play').click();
const artifacts = new URL('../tests/visualPlayground/artifacts/', import.meta.url);

test('visual playground experiments in Chromium', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  await mkdir(artifacts, { recursive: true });
  const measurements = [];

  const scenario = (name, run, mode = 'editor') => context.test(name, async () => {
    const page = await browser.newPage({ viewport: { width: 1560, height: 1100 } });
    await page.addInitScript(() => {
      const NativeResizeObserver = window.ResizeObserver;
      window.liveGeometryObservers = new Set();
      window.ResizeObserver = class extends NativeResizeObserver {
        observe(element, options) {
          if (element.matches('[data-story-region], [data-book-application]')) {
            window.liveGeometryObservers.add(this);
          }
          super.observe(element, options);
        }
        disconnect() {
          window.liveGeometryObservers.delete(this);
          super.disconnect();
        }
      };
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto(`${origin}/tests/visualPlayground/?mode=${mode}`);
      await page.locator('[data-demo-effect="frame"]').waitFor();
      await run(page);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  await scenario('opacity control keeps demo renderers mounted and reveals darkened content', async (page) => {
    await patch(page, { demo: 'darkness', duration: 350, intensity: 1 });
    await play(page);
    await waitRun(page, 'darkness');
    const darkness = page.locator('[data-demo-effect="darkness"]');
    const token = await darkness.getAttribute('data-token');
    const transparencySlider = page.getByRole('slider', { name: 'Прозрачность эффекта' });
    await transparencySlider.press('End');

    for (let step = 0; step < 7; step += 1) {
      await transparencySlider.press('ArrowLeft');
    }
    await settle(page);
    const opacity = await darkness.evaluate((element) => Number(getComputedStyle(element).opacity));
    near(opacity, 0.35, 'opacity is independent from intensity');
    assert.equal(await darkness.getAttribute('data-token'), token, 'opacity does not remount the renderer');

    await patch(page, { demo: 'edges', duration: 350, opacity: 0.4 });
    await play(page);
    await waitRun(page, 'edges');
    const underlay = await page.locator('[data-demo-effect="edges"]').evaluate((element) => {
      return Number(getComputedStyle(element).opacity);
    });
    near(underlay, 0.4, 'edge darkness keeps diagnostic opacity despite its fixed intensity');
  });

  await scenario('shared CSS layout matches real regions, toolbar variations and internal frame anchors', async (page) => {
    const original = await frameToken(page);
    for (const options of [
      { width: 1040, height: 690, toolbar: true, toolbarHeight: 48, region: 'storyViewport', mask: false },
      { width: 820, height: 560, toolbar: true, toolbarHeight: 92, region: 'narrativeFrame', mask: false },
      { width: 1040, height: 720, toolbar: false, toolbarHeight: 48, region: 'narrativeFrame', mask: true },
      { width: 390, height: 740, toolbar: true, toolbarHeight: 70, region: 'storyViewport', mask: true },
      { width: 1040, height: 690, toolbar: true, toolbarHeight: 48, region: 'storyViewport', mask: true },
    ]) {
      await patch(page, { ...options, layout: 'geometry' });
      const geometry = await bounds(page, '[data-visual-content="frame"]');
      const clipGeometry = await bounds(page, '[data-visual-surface="frame"]');
      const jsCorners = await page.locator('[data-visual-surface="frame"]').evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.borderTopLeftRadius, style.borderBottomLeftRadius];
      });
      const elementGeometry = await bounds(page, '[data-effect-id="frame-text"] [class*="FrameElement"]');
      await patch(page, { layout: 'css' });
      const css = await bounds(page, '[data-visual-content="frame"]');
      const clipCss = await bounds(page, '[data-visual-surface="frame"]');
      const cssCorners = await page.locator('[data-visual-surface="frame"]').evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.borderTopLeftRadius, style.borderBottomLeftRadius];
      });
      assert.deepEqual(cssCorners, jsCorners, 'rounded region corners match');
      const elementCss = await bounds(page, '[data-effect-id="frame-text"] [class*="FrameElement"]');
      for (const key of ['x', 'y', 'width', 'height']) {
        near(css[key], geometry[key], `surface ${key} ${JSON.stringify(options)}`);
        near(clipCss[key], clipGeometry[key], `clip ${key}`);
        near(elementCss[key], elementGeometry[key], `inner frame ${key}`);
      }
      assert.equal(await frameToken(page), original, 'switching layout does not reparent the renderer');
      assert.equal(await page.evaluate(() => window.liveGeometryObservers.size), 1, 'CSS adds no second measurer');
      measurements.push({ options, geometry, css, clipGeometry, clipCss });
    }

    await patch(page, { width: 1040, region: 'storyViewport', mask: false, frameAnchor: 'center', offsetX: 35 });
    const cssAnchor = await bounds(page, '[data-effect-id="frame-text"] [class*="FrameElement"]');
    await patch(page, { layout: 'geometry' });
    const jsAnchor = await bounds(page, '[data-effect-id="frame-text"] [class*="FrameElement"]');
    near(cssAnchor.x, jsAnchor.x, 'independent inner anchor');
    await page.screenshot({ path: new URL('01-frame-js.png', artifacts).pathname });
    await patch(page, { layout: 'css' });
    await page.screenshot({ path: new URL('02-frame-css.png', artifacts).pathname });
    await page.setViewportSize({ width: 1100, height: 850 });
    await settle(page);
    const afterWindowResize = await bounds(page, '[data-visual-content="frame"]');
    const main = await bounds(page, '[data-story-region="storyViewport"]');
    near(afterWindowResize.width, main.width, 'window resize width');
    near(afterWindowResize.height, main.height, 'window resize height');
  });

  await scenario('CSS limitation is visible; JS and explicit hybrid track scrolling custom anchors', async (page) => {
    await patch(page, { customPlacement: true, layout: 'css' });
    assert.equal(await page.getByTestId('layout-status').getAttribute('data-unsupported'), 'true');
    assert.equal(await page.locator('[data-surface-layout="css"]').count(), 1);
    await page.screenshot({ path: new URL('03-css-unsupported.png', artifacts).pathname });
    const css = await bounds(page, '[data-visual-content="frame"]');
    await patch(page, { layout: 'geometry' });
    const js = await bounds(page, '[data-visual-content="frame"]');
    assert(Math.abs(css.height - js.height) > 100, 'the unsupported CSS result is not secretly JS');
    const original = await frameToken(page);
    await page.locator('#narrative').evaluate((element) => { element.scrollTop = 180; });
    await settle(page);
    const scrolled = await bounds(page, '[data-visual-content="frame"]');
    near(scrolled.y, js.y - 180, 'moving narrativeContent anchor');
    await patch(page, { layout: 'hybrid' });
    const hybrid = await bounds(page, '[data-visual-content="frame"]');
    near(hybrid.y, scrolled.y, 'explicit hybrid geometry path');
    assert.equal(await frameToken(page), original);
    await patch(page, { independentAnchor: true, layout: 'geometry' });
    const fixedAnchor = await bounds(page, '[data-visual-content="frame"]');
    await page.locator('#narrative').evaluate((element) => { element.scrollTop += 100; });
    await settle(page);
    near((await bounds(page, '[data-visual-content="frame"]')).y, fixedAnchor.y, 'independent viewport anchor stays fixed');
    await patch(page, { layout: 'css' });
    assert.equal(await page.getByTestId('layout-status').getAttribute('data-unsupported'), 'true');
    await patch(page, { layout: 'hybrid' });
    near((await bounds(page, '[data-visual-content="frame"]')).y, fixedAnchor.y, 'hybrid independent anchor');
    await page.screenshot({ path: new URL('03-cross-region-hybrid.png', artifacts).pathname });
  });

  await scenario('one session preserves animated frame identity across resize and disjoint active pages', async (page) => {
    await play(page);
    const token = await frameToken(page);
    await page.evaluate(() => {
      window.savedFrameAnimation = document.querySelector('[data-effect-id="frame"]')?.getAnimations({ subtree: true })[0];
    });
    await patch(page, { width: 900, toolbarHeight: 85, layout: 'css' });
    await page.getByRole('button', { name: 'Страница 4', exact: true }).click();
    await settle(page);
    assert.equal(await frameToken(page), token);
    assert.equal(await page.evaluate(() => document.querySelector('[data-effect-id="frame"]')
      ?.getAnimations({ subtree: true }).includes(window.savedFrameAnimation)), true);
    await page.getByRole('button', { name: 'Выйти из диапазона', exact: true }).click();
    await settle(page);
    assert.equal(await page.locator('[data-demo-effect="frame"]').count(), 0);
    await page.getByRole('button', { name: 'Страница 1', exact: true }).click();
    await settle(page);
    assert.notEqual(await frameToken(page), token);
  });

  await scenario('external overlay covers a smaller story; underlay is occluded including rounded viewport corners', async (page) => {
    await patch(page, { demo: 'darkness', duration: 350, storySize: 70, intensity: 1 });
    await play(page);
    await waitRun(page, 'darkness');
    const app = await bounds(page, '[data-book-application]');
    const story = await bounds(page, '[data-story-region="story"]');
    const overlay = await bounds(page, '[data-visual-surface="darkness"]');
    assert(story.width < app.width && story.height < app.height);
    near(overlay.x, app.x, 'external x');
    near(overlay.width, app.width, 'external width');
    await page.screenshot({ path: new URL('04-external-darkness.png', artifacts).pathname });
    await patch(page, { demo: 'edges', duration: 350, storySize: 100, color: '#000000' });
    const viewport = await bounds(page, '[data-story-region="storyViewport"]');
    const sample = { x: viewport.x + viewport.width / 2, y: viewport.y + viewport.height - 7 };
    const before = (await pixels(page))(sample.x, sample.y);
    await play(page);
    await waitRun(page, 'edges');
    const color = await pixels(page);
    assert.deepEqual(color(sample.x, sample.y), before, 'opaque viewport hides underlay');
    assert.deepEqual(color(app.x + 5, app.y + 5), [0, 0, 0]);
    assert.deepEqual(color(viewport.x + 1, viewport.y + 1), [0, 0, 0], 'rounded corner exposes underlay');
    await page.screenshot({ path: new URL('05-underlay-corners.png', artifacts).pathname });

    await patch(page, { demo: 'darkness', region: 'story', duration: 350 });
    // Explicitly set the scope after selecting a preset, whose default is application.
    await patch(page, { region: 'story', storySize: 70 });
    await play(page);
    await waitRun(page, 'darkness');
    const internal = await bounds(page, '[data-visual-surface="darkness"]');
    near(internal.width, (await bounds(page, '[data-story-region="story"]')).width, 'existing story scope');
    assert(internal.width < app.width);
  });

  await scenario('smoke and a single wave cross regions without renderer replacement; feedback stays above overlays', async (page) => {
    await patch(page, { demo: 'smoke', storySize: 65, duration: 5000 });
    await play(page);
    await page.waitForTimeout(400);
    const smoke = page.locator('[data-demo-effect="smoke"]');
    const token = await smoke.getAttribute('data-token');
    assert.equal(await smoke.locator('i').count(), 23);
    await page.screenshot({ path: new URL('06-css-smoke.png', artifacts).pathname });
    await patch(page, { width: 950, intensity: 0.7 });
    assert.equal(await smoke.getAttribute('data-token'), token);
    await patch(page, { demo: 'through', duration: 2000 });
    await play(page);
    await page.waitForTimeout(800);
    assert.equal(await page.locator('[data-demo-effect="through"]').count(), 1);
    await page.screenshot({ path: new URL('07-single-wave.png', artifacts).pathname });
    await patch(page, { composition: 'multiple' });
    await play(page);
    assert.equal(await page.locator('[data-demo-effect^="through-"]').count(), 3);
    await page.waitForTimeout(800);
    await page.screenshot({ path: new URL('08-composed-wave.png', artifacts).pathname });

    await patch(page, { demo: 'darkness', duration: 350, intensity: 1 });
    await play(page);
    await waitRun(page, 'darkness');
    await page.evaluate(() => {
      const session = window.playground.session;
      const registration = session.getSnapshot()[0];
      session.register({
        ...registration,
        effect: { ...registration.effect, id: 'feedback', definitionId: 'lab.feedback' },
      });
    });
    await page.getByTestId('system-feedback-probe').waitFor();
    assert.equal(await page.getByTestId('system-feedback-probe').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return element.closest('[data-application-host="feedback"]') !== null && rect.width > 0;
    }), true);
    const feedback = await bounds(page, '[data-testid="system-feedback-probe"]');
    assert.deepEqual((await pixels(page))(feedback.x + 2, feedback.y + 2), [240, 67, 135]);
    assert.equal(await page.getByTestId('play').isEnabled(), true, 'tools remain outside decorative overlays');
  });

  await scenario('scale and real layout collapse reach zero, restore, and cancel without style leaks', async (page) => {
    for (const mode of ['scale', 'size']) {
      await patch(page, { demo: 'collapse', duration: 700, physicalMode: mode });
      const baseline = await page.locator('[data-story-region="storyViewport"]').evaluate((element) => ({
        width: element.clientWidth,
        height: element.clientHeight,
      }));
      const previousReveal = (await currentRun(page, 'reveal'))?.number ?? 0;
      await play(page);
      await page.waitForFunction(() => document.querySelector('[data-layout-mode]')
        ?.style.getPropertyValue('--visual-layout-factor') === '0');
      const collapsed = await page.locator('[data-story-region="storyViewport"]').evaluate((element) => ({
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
      }));
      assert.equal(collapsed.width, 0);
      assert.equal(collapsed.height, 0);
      assert.equal(collapsed.clientWidth, mode === 'scale' ? baseline.width : 0);
      const curtain = await bounds(page, '[data-visual-surface="curtain"]');
      near(curtain.width, (await bounds(page, '[data-book-application]')).width, 'curtain stays fixed');
      await page.screenshot({ path: new URL(`09-collapse-${mode}.png`, artifacts).pathname });
      await waitRun(page, 'reveal', 'completed', previousReveal);
      assert.equal(await page.locator('[data-layout-mode]').count(), 0);
      const restored = await bounds(page, '[data-story-region="storyViewport"]');
      near(restored.width, baseline.width, 'restored width');
      measurements.push({ mode, baseline, collapsed, restored });

      await patch(page, { duration: 1000 });
      await play(page);
      await waitRun(page, 'collapse', 'running');
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: 'Стоп / сброс', exact: true }).click();
      assert.equal(await page.locator('[data-layout-mode]').count(), 0);
      assert.equal((await currentRun(page, 'collapse')).status, 'cancelled');
      assert.equal(await page.evaluate(() => window.playground.session.runs.listenerCount()), 1, 'only UI diagnostics remain');

      await play(page);
      await page.waitForFunction(() => document.querySelector('[data-layout-mode]'));
      await page.evaluate(() => window.playground.session.remove('collapse'));
      await settle(page);
      assert.equal(await page.locator('[data-layout-mode]').count(), 0, 'removing the effect releases its lease');
      assert.equal(await currentRun(page, 'collapse'), undefined);
    }
  });

  await scenario('milestones, late subscriptions, replay, StrictMode and closing the book', async (page) => {
    await patch(page, { demo: 'sequence', duration: 400 });
    await play(page);
    await waitRun(page, 'reveal');
    const first = await currentRun(page, 'narrative-dark');
    assert.equal(first.number, 1, 'StrictMode does not replay the start command');
    assert(first.milestones.includes('boundary-reached'));
    await page.evaluate(async () => {
      const runs = window.playground.session.runs;
      await runs.wait(runs.read('narrative-dark'), {
        milestone: 'boundary-reached',
        signal: new AbortController().signal,
      });
    });
    const log = await page.getByTestId('run-events').innerText();
    assert(log.includes('completed'));
    await play(page);
    await waitRun(page, 'narrative-dark', 'running');
    assert((await currentRun(page, 'narrative-dark')).number > first.number);
    await page.evaluate(() => {
      const runs = window.playground.session.runs;
      window.pendingCancellation = runs.wait(runs.read('narrative-dark'), {
        signal: new AbortController().signal,
      }).then(() => 'unexpected completion', (reason) => reason.name);
    });
    await page.evaluate(() => window.playground.setVisible(false));
    await settle(page);
    assert.equal(await page.locator('[data-demo-effect]').count(), 0);
    assert.equal(await page.evaluate(() => window.pendingCancellation), 'AbortError');
    assert.equal(await currentRun(page, 'narrative-dark'), undefined, 'removed registration releases run state');
    assert.equal(await page.evaluate(() => window.playground.session.runs.listenerCount()), 1);
    await patch(page, { demo: 'single', duration: 600 });
    await page.evaluate(() => window.playground.setVisible(true));
    await page.locator('[data-demo-effect="single"]').waitFor();
    await play(page);
    await waitRun(page, 'single');
    assert.equal(await page.locator('[data-layout-mode]').count(), 0);
    await page.evaluate(() => window.playground.session.destroy());
    await settle(page);
    assert.equal(await page.locator('[data-demo-effect]').count(), 0);
    assert.equal(await page.evaluate(() => window.playground.session.runs.listenerCount()), 0);
  });

  await scenario('reader: external range continuity, pause/resume, cancellation and resource teardown', async (page) => {
    await patch(page, { demo: 'darkness', duration: 5000, storySize: 65 });
    await play(page);
    await page.waitForTimeout(250);
    const run = await currentRun(page, 'darkness');
    const token = await page.locator('[data-demo-effect="darkness"]').getAttribute('data-token');
    await page.getByRole('button', { name: 'Пауза', exact: true }).click();
    assert.equal((await currentRun(page, 'darkness')).status, 'paused');
    const paused = await page.locator('[data-demo-effect="darkness"]').getAttribute('data-progress');
    await page.waitForTimeout(100);
    assert.equal(await page.locator('[data-demo-effect="darkness"]').getAttribute('data-progress'), paused);
    await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
    assert.equal((await currentRun(page, 'darkness')).number, run.number);
    await page.getByRole('button', { name: 'Страница 4', exact: true }).click();
    await settle(page);
    assert.equal(await page.locator('[data-demo-effect="darkness"]').getAttribute('data-token'), token);
    await patch(page, { width: 390, height: 740 });
    assert.equal(await page.locator('[data-demo-effect="darkness"]').getAttribute('data-token'), token);
    await page.evaluate(() => {
      const runs = window.playground.session.runs;
      window.pendingCancellation = runs.wait(runs.read('darkness'), {
        signal: new AbortController().signal,
      }).then(() => 'unexpected completion', (reason) => reason.name);
    });
    await page.evaluate(() => window.playground.setVisible(false));
    await settle(page);
    assert.equal(await page.evaluate(() => window.pendingCancellation), 'AbortError');
    assert.equal(await currentRun(page, 'darkness'), undefined);
    assert.equal(await page.locator('[data-demo-effect]').count(), 0);
    assert.equal(await page.evaluate(() => window.liveGeometryObservers.size), 0, 'closing releases region observers');
  }, 'reader');

  await writeFile(new URL('measurements.json', artifacts), `${JSON.stringify(measurements, null, 2)}\n`);
});
