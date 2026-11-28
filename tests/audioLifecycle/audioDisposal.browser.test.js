import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openAudio } from './audioLifecycleFixture.js';

test('short real loop releases every Howl after its lifetime, preserving the existing unload fade', async (context) => {
  const page = await openAudio(context);
  await page.evaluate(() => window.audioLifecycle.create({
    id: 'loop',
    src: '/tests/audioLifecycle/short.wav',
    relativeVolume: 150,
    loop: true,
    fadeOutWhenUnload: true,
  }));
  await page.waitForFunction(() => window.audioLifecycle.get('loop').state() === 'loaded');
  await page.evaluate(() => window.audioLifecycle.get('loop').play());
  await page.waitForFunction(() => window.audioLifecycle.events.includes('play:loop'));
  await page.evaluate(async () => {
    const { cleanup } = window.audioLifecycle;
    await Promise.all([cleanup('loop'), cleanup('loop')]);
    await window.audioLifecycle.get('loop').play();
    await cleanup();
  });
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.audioLifecycle.resourceCount()), 0);
  assert.equal(await page.evaluate(() => window.audioLifecycle.get('loop').state()), 'unloaded');
  const events = await page.evaluate(() => window.audioLifecycle.events);
  assert.equal(events.filter((event) => event === 'play:loop').length, 1);
  assert.equal(events.filter((event) => event === 'unload:loop').length, 1);
});

test('explicit cleanup lets a short real loop finish only its current iteration', async (context) => {
  const page = await openAudio(context);
  await page.evaluate(() => window.audioLifecycle.create({
    id: 'finite',
    src: '/tests/audioLifecycle/short.wav',
    relativeVolume: 200,
    loop: true,
  }));
  await page.waitForFunction(() => window.audioLifecycle.get('finite').state() === 'loaded');
  const wasPlaying = await page.evaluate(async () => {
    const fixture = window.audioLifecycle;
    const audio = fixture.get('finite');
    const wasPlaying = await new Promise((resolve, reject) => {
      audio.howlInst.once('play', () => {
        const cleanup = fixture.cleanup('finite', { waitTillTheEnd: true });
        const wasPlaying = audio.playing();
        // Howler dispatches listeners in reverse registration order: record end before cleanup reacts to it.
        audio.howlInst.once('end', () => fixture.events.push('end:finite'));
        cleanup.then(() => resolve(wasPlaying), reject);
      });
      void audio.play();
    });
    await fixture.cleanup();

    return wasPlaying;
  });
  assert.equal(wasPlaying, true);
  const events = await page.evaluate(() => window.audioLifecycle.events);
  assert.equal(events.filter((event) => event === 'play:finite').length, 1);
  assert.equal(events.filter((event) => event === 'end:finite').length, 1);
  assert(events.indexOf('end:finite') < events.indexOf('unload:finite'));
  assert.equal(await page.evaluate(() => window.audioLifecycle.resourceCount()), 0);
});

test('failed amplified audio has no output node and unloads without starting a voice', async (context) => {
  const page = await openAudio(context);
  const result = await page.evaluate(async () => {
    const fixture = window.audioLifecycle;
    const audio = fixture.create({
      id: 'failed',
      src: '/tests/audioLifecycle/unsupported.activebook',
      relativeVolume: 200,
    });
    const outcome = await new Promise((resolve) => audio.observeLoad(resolve));
    await audio.play(true);
    const output = Reflect.get(Reflect.get(audio, 'gain'), 'output');
    await audio.unload();
    await fixture.cleanup();

    return {
      outcome,
      hasOutput: Boolean(output),
      events: fixture.events,
      resources: fixture.resourceCount(),
    };
  });

  assert.equal(result.outcome, 'failed');
  assert.equal(result.hasOutput, false);
  assert.deepEqual(result.events, ['unload:failed', 'unload:audio']);
  assert.equal(result.resources, 0);
});
