import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openBrowserFixture } from './browserFixture.js';

const counter = (page, id = 'range-a') => page.locator(`[data-counter="${id}"]`);
const readCounter = (page, id = 'range-a') => counter(page, id).evaluate((element) => ({
  token: element.dataset.token,
  ticks: Number(element.dataset.ticks),
  playing: element.dataset.playing === 'true',
  label: element.dataset.label,
  width: Number(element.dataset.width),
  height: Number(element.dataset.height),
}));
const metrics = (page) => page.evaluate(() => window.visualLifecycle.metrics);
const nextFrames = (page) => page.evaluate(() => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(resolve));
}));
const goToPage = async (page, number) => {
  await page.evaluate((number) => window.visualLifecycle.goToPage(number), number);
  await nextFrames(page);
  if ([1, 2, 4, 5].includes(number)) {
    const names = { 1: 'one', 2: 'two', 4: 'four', 5: 'five' };
    await page.getByTestId(`page-${names[number]}`).waitFor();
  }
};
const waitTicks = (page, { id = 'range-a', above = 2 } = {}) => page.waitForFunction(({ id, above }) => {
  return Number(document.querySelector(`[data-counter="${id}"]`)?.getAttribute('data-ticks')) > above;
}, { id, above });
const command = async (page, { id = 'range-a', action }) => {
  await page.evaluate(({ id, action }) => window.visualLifecycle.effects.getController(id)?.playback?.[action](),
    { id, action });
  await nextFrames(page);
};

const assertReleased = async (page) => {
  await page.waitForFunction(() => Object.values(window.visualLifecycle.metrics).every((entry) => {
    return entry.liveResources === 0 && entry.activeTimers === 0 && entry.pendingLoads === 0;
  }));
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 80)));
  for (const [id, entry] of Object.entries(await metrics(page))) {
    assert.equal(entry.mounts, entry.unmounts, `${id}: balanced mount/cleanup`);
    assert.equal(entry.lateCallbacks, 0, `${id}: no stale async resource callback`);
  }
  assert.equal(await page.evaluate(() => window.visualLifecycle.effects.getSnapshot().some(({ effect }) => {
    return window.visualLifecycle.effects.getController(effect.id) !== undefined;
  })), false);
};

test('registered visual lifecycle in Chromium', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const scenario = async (name, { mode, strict = false }, run) => context.test(`${mode}: ${name}`, async () => {
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto(`${origin}/tests/visualLifecycle/?mode=${mode}${strict ? '&strict' : ''}`);
      await page.waitForFunction(() => window.visualLifecycle?.ready);
      await run(page);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  for (const mode of ['reader', 'editor']) {
    await scenario('page lifetime and continuous state across disjoint ranges and missing geometry', { mode }, async (page) => {
      assert.equal(await counter(page).count(), 0);
      await goToPage(page, 1);
      await waitTicks(page);
      const initialPage = await readCounter(page, 'page');
      const before = await readCounter(page);
      const node = await counter(page).elementHandle();
      assert.equal(before.label, 'default label');
      await goToPage(page, 2);
      assert.equal(await counter(page, 'page').count(), 0);
      await waitTicks(page, { above: before.ticks });
      assert.equal((await readCounter(page)).token, before.token);
      assert.equal(await node.evaluate((element) => element === document.querySelector('[data-counter="range-a"]')), true);
      const after = await readCounter(page);
      await goToPage(page, 5); // Crosses an inactive page without visiting it.
      await waitTicks(page, { above: after.ticks });
      assert.equal((await readCounter(page)).token, before.token);
      assert.equal((await metrics(page))['range-a'].mounts, 1);
      assert.equal((await metrics(page)).page.unmounts, 1);
      assert.equal(await page.locator('[data-effect-id="background-one"]').count(), 0);
      await page.locator('[data-effect-id="background-five"]').waitFor();
      await page.locator('[data-effect-id="behind-five"]').waitFor();

      const withGeometry = await readCounter(page);
      await goToPage(page, 3); // Empty page content keeps the real regions mounted.
      await page.waitForFunction(() => document.querySelector('#story-shell').dataset.pageId === 'page-3');
      await page.locator('[data-visual-surface="range-a"]').waitFor({ state: 'visible' });
      await waitTicks(page, { above: withGeometry.ticks });
      const missing = await readCounter(page);
      assert.equal(missing.token, before.token);
      assert.equal(missing.width, withGeometry.width);
      assert.equal(missing.height, withGeometry.height);
      await goToPage(page, 2);
      await page.locator('[data-visual-surface="range-a"]').waitFor({ state: 'visible' });
      const beforeLoading = await readCounter(page);
      await page.getByTestId('loading').click();
      await page.locator('[data-story-content][aria-busy="true"]').waitFor({ state: 'attached' });
        assert(await page.locator('[data-story-region="narrativeFrame"]').isVisible(), 'loader keeps permanent regions in layout');
      await waitTicks(page, { above: beforeLoading.ticks });
      assert.equal((await readCounter(page)).token, before.token);
      await page.getByTestId('loading').click();
      await page.locator('[data-visual-surface="range-a"]').waitFor({ state: 'visible' });
      const currentMetrics = (await metrics(page))['range-a'];
      assert.equal(currentMetrics.mounts, 1);
      assert.equal(currentMetrics.loads, 1);
      assert.equal(currentMetrics.playCalls, 0, 'navigation never restarts playback');
      await page.evaluate(() => window.visualLifecycle.effects.update('range-a', { effect: { params: { autoPlay: false } } }));
      assert.equal((await readCounter(page)).playing, true, 'parameter updates do not reset internal playback state');
      await goToPage(page, 4);
      assert.equal(await counter(page).count(), 0);
      assert.equal((await metrics(page))['range-a'].liveResources, 0);
      assert.equal((await metrics(page))['range-a'].activeTimers, 0);
      await goToPage(page, 1);
      const reentered = await readCounter(page);
      assert.notEqual(reentered.token, before.token);
      assert.equal(reentered.ticks, 0);
      assert.equal(reentered.playing, false);
      assert.notEqual((await readCounter(page, 'page')).token, initialPage.token);
      assert.equal((await metrics(page))['range-a'].mounts, 2);
      await page.evaluate(() => window.visualLifecycle.setBookVisible(false));
      await assertReleased(page);
    });

    await scenario('addressed updates, optional playback, independent instances and stale handles', { mode }, async (page) => {
      await goToPage(page, 1);
      await waitTicks(page);
      await command(page, { action: 'pause' });
      await command(page, { id: 'range-b', action: 'pause' });
      const first = await readCounter(page);
      const second = await readCounter(page, 'range-b');
      assert.notEqual(first.token, second.token);
      const beforeMetrics = await metrics(page);
      await page.evaluate(() => {
        const effects = window.visualLifecycle.effects;
        const current = effects.getSnapshot().find(({ effect }) => effect.id === 'range-a').effect;
        effects.update('range-a', {
          effect: {
            params: { label: 'updated', step: 3 },
            placement: {
              ...current.placement,
              offset: { x: { value: 11, unit: 'px' }, y: { value: 7, unit: 'px' } },
              size: { width: { value: 50, unit: '%' }, height: { value: 40, unit: 'px' } },
            },
            visibility: { mask: { type: 'circle', center: { x: { value: 50, unit: '%' }, y: { value: 50, unit: '%' } },
                radius: { value: 50, unit: '%' } } },
            depth: { plane: 'aboveNarrative', order: 9 },
          },
        });
      });
      await nextFrames(page);
      const updated = await readCounter(page);
      assert.equal(updated.token, first.token);
      assert.equal(updated.ticks, first.ticks);
      assert.equal(updated.label, 'updated');
      assert.equal(updated.height, 40);
      assert(updated.width < first.width);
      assert.deepEqual(await readCounter(page, 'range-b'), second);
      assert.equal((await metrics(page))['range-a'].mounts, beforeMetrics['range-a'].mounts);
      assert.equal((await metrics(page))['range-a'].loads, beforeMetrics['range-a'].loads);
      assert.equal(await page.evaluate(() => window.visualLifecycle.effects.getController('static').playback), undefined);
      assert.equal(await page.locator('[data-static="static"]').textContent(), 'static default');

      await command(page, { id: 'range-b', action: 'play' });
      await waitTicks(page, { id: 'range-b', above: second.ticks });
      await command(page, { id: 'range-b', action: 'pause' });
      const paused = await readCounter(page, 'range-b');
      await goToPage(page, 5);
      assert.equal((await readCounter(page, 'range-b')).ticks, paused.ticks);
      assert.equal((await readCounter(page, 'range-b')).token, second.token);
      await command(page, { id: 'range-b', action: 'play' });
      await waitTicks(page, { id: 'range-b', above: paused.ticks });
      await command(page, { id: 'range-b', action: 'stop' });
      assert.equal((await readCounter(page, 'range-b')).ticks, 0);
      assert.equal((await readCounter(page, 'range-b')).playing, false);
      // Retain the exact reset assertion, then allow any old interval task to arrive.
      await page.waitForTimeout(100);
      assert.equal((await readCounter(page, 'range-b')).ticks, 0);
      assert.equal((await metrics(page))['range-b'].activeTimers, 0);
      await page.evaluate(() => {
        const effects = window.visualLifecycle.effects;
        const controller = effects.getController('range-a');
        controller.destroy();
        controller.destroy();
        effects.getController('static').destroy();
        window.visualLifecycle.heldController = effects.getController('range-b');
        window.visualLifecycle.heldPlayback = window.visualLifecycle.heldController.playback;
        const registration = effects.getSnapshot().find(({ effect }) => effect.id === 'range-b');
        effects.remove('range-b');
        effects.register(registration); // Same ID in the same React batch must start a new instance.
      });
      await nextFrames(page);
      assert.equal(await counter(page).count(), 0);
      assert.equal(await page.locator('[data-static="static"]').count(), 0);
      const replacement = await readCounter(page, 'range-b');
      assert.notEqual(replacement.token, second.token);
      const playCalls = (await metrics(page))['range-b'].playCalls;
      await page.evaluate(() => {
        window.visualLifecycle.heldPlayback.play();
        window.visualLifecycle.heldPlayback.pause();
        window.visualLifecycle.heldPlayback.stop();
        window.visualLifecycle.heldController.destroy();
      });
      await nextFrames(page);
      assert.equal((await readCounter(page, 'range-b')).token, replacement.token);
      assert.equal((await metrics(page))['range-b'].playCalls, playCalls);
      await page.evaluate(() => window.visualLifecycle.setBookVisible(false));
      await assertReleased(page);
      await page.evaluate(() => window.visualLifecycle.setBookVisible(true));
      await counter(page, 'range-b').waitFor();
      assert.notEqual((await readCounter(page, 'range-b')).token, replacement.token);
      await page.evaluate(() => window.visualLifecycle.setBookVisible(false));
      await assertReleased(page);
    });

    await scenario('rapid navigation, pending resource cleanup and legacy coexistence', { mode }, async (page) => {
      for (const number of [1, 2, 5, 3, 2, 4, 1, 5, 2, 4, 1]) {
        await goToPage(page, number);
        const current = await metrics(page);
        assert(Object.values(current).every((entry) => entry.liveResources <= 1 && entry.activeTimers <= 1));
      }
      await page.locator('[data-effect-id="background-one"]').waitFor();
      await page.locator('[data-effect-id="behind-one"]').waitFor();
      await page.evaluate(() => {
        const { effects, registration } = window.visualLifecycle;
        effects.register({
          ...registration,
          effect: { ...registration.effect, id: 'temporary', params: { loadDelay: 1000 } },
        });
      });
      await counter(page, 'temporary').waitFor();
      assert.equal((await metrics(page)).temporary.pendingLoads, 1);
      await page.evaluate(() => window.visualLifecycle.effects.remove('temporary'));
      await nextFrames(page);
      assert.equal((await metrics(page)).temporary.pendingLoads, 0);
      assert.equal((await metrics(page)).temporary.loads, 0);
      await page.evaluate(() => window.visualLifecycle.setBookVisible(false));
      await assertReleased(page);
    });

    await scenario('StrictMode host/ref cleanup can reconnect safely', { mode, strict: true }, async (page) => {
      await goToPage(page, 1);
      await waitTicks(page);
      const original = await readCounter(page);
      await goToPage(page, 2);
      assert.equal((await readCounter(page)).token, original.token);
      assert.equal((await metrics(page))['range-a'].liveResources, 1);
      assert.equal(await page.evaluate(() => !!window.visualLifecycle.effects.getController('range-a')?.playback), true);
      await page.evaluate(() => window.visualLifecycle.setBookVisible(false));
      await assertReleased(page);
    });
  }
});
