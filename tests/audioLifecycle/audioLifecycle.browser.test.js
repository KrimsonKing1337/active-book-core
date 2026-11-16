import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openAudio } from './audioLifecycleFixture.js';

test('real Howler cancels delayed requests on stop/pause and permits a fresh start', async (context) => {
  const page = await openAudio(context);
  await page.evaluate(async () => {
    const audio = window.audioLifecycle.get();
    audio.delay = 150;
    await audio.play();
    await audio.play();
    await audio.stop();
    await audio.play();
    await audio.pause();
  });
  // Observe beyond the cancelled deadlines; there must be no late start event.
  await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(() => window.audioLifecycle.events), []);
  await page.evaluate(() => window.audioLifecycle.get().play());
  await page.waitForFunction(() => window.audioLifecycle.events.includes('play:audio'));
  assert.equal(await page.evaluate(() => window.audioLifecycle.get().playing()), true);
  await page.evaluate(() => window.audioLifecycle.get().unload());
  assert.equal(await page.evaluate(() => window.audioLifecycle.resourceCount()), 0);
});

test('real Howler preserves overlapping voices, paused resume and independent effects', async (context) => {
  const page = await openAudio(context);
  await page.evaluate(() => window.audioLifecycle.create({ id: 'second' }));
  await page.waitForFunction(() => window.audioLifecycle.get('second').state() === 'loaded');
  await page.evaluate(async () => {
    const first = window.audioLifecycle.get();
    await first.play();
    await first.play();
    await window.audioLifecycle.get('second').play();
  });
  await page.waitForFunction(() => window.audioLifecycle.events.length === 3);
  const soundIds = await page.evaluate(() => {
    const sounds = Reflect.get(window.audioLifecycle.get().howlInst, '_sounds');

    return sounds.filter((sound) => !sound._paused).map((sound) => sound._id);
  });
  assert.equal(new Set(soundIds).size, 2);
  await page.evaluate(() => window.audioLifecycle.get().stop());
  assert.equal(await page.evaluate(() => window.audioLifecycle.get('second').playing()), true);
  await page.evaluate(async () => {
    const second = window.audioLifecycle.get('second');
    await second.pause();
    await second.play();
  });
  await page.waitForFunction(() => window.audioLifecycle.events.length === 4);
  await page.evaluate(async () => {
    await window.audioLifecycle.get().unload();
    await window.audioLifecycle.get('second').unload();
  });
  assert.equal(await page.evaluate(() => window.audioLifecycle.resourceCount()), 0);
});

test('real Howler cannot restart from an obsolete fade continuation after unload', async (context) => {
  const page = await openAudio(context);
  const hasReleasedFades = await page.evaluate(async () => {
    const audio = window.audioLifecycle.get();
    const play = audio.play(true);
    const sounds = Reflect.get(audio.howlInst, '_sounds');
    await audio.unload();
    await audio.unload();
    await play;

    return sounds.every((sound) => !sound._interval);
  });
  assert.equal(hasReleasedFades, true);
  await page.waitForTimeout(1100);
  assert.deepEqual(await page.evaluate(() => window.audioLifecycle.events), ['unload:audio']);
  assert.equal(await page.evaluate(() => window.audioLifecycle.resourceCount()), 0);
  assert.equal(await page.evaluate(() => window.audioLifecycle.get().state()), 'unloaded');
});

test('real Howler cancels stop and lifetime cleanup while resources are still loading', async (context) => {
  const page = await openAudio(context);
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/delayed.wav', async (route) => {
    await gate;
    await route.fulfill({ path: new URL('./tone.wav', import.meta.url).pathname, contentType: 'audio/wav' });
  });
  context.after(() => release());
  await page.evaluate(async () => {
    const audio = window.audioLifecycle.create({ id: 'loading', src: '/delayed.wav' });
    await audio.play();
    await audio.stop();
    const disposed = window.audioLifecycle.create({ id: 'disposed', src: '/delayed.wav' });
    await disposed.play();
    await window.audioLifecycle.cleanup('disposed');
  });
  release();
  await page.waitForFunction(() => window.audioLifecycle.get('loading').state() === 'loaded');
  await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(() => window.audioLifecycle.events), ['unload:disposed']);
  assert.equal(await page.evaluate(() => window.audioLifecycle.get('disposed').state()), 'unloaded');
  await page.evaluate(async () => {
    await window.audioLifecycle.get('loading').unload();
    await window.audioLifecycle.get().unload();
  });
  assert.equal(await page.evaluate(() => window.audioLifecycle.resourceCount()), 0);
});
