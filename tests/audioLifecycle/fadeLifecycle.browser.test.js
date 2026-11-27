import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { openAudio } from './audioLifecycleFixture.js';

test('StrictMode replacement and unmount settle fades without touching the new instance', async (context) => {
  const page = await openAudio(context);
  const result = await page.evaluate(async () => {
    const strict = await import('/tests/audioLifecycle/strictFade.tsx');
    const {
      wait,
      readVoices,
      until,
    } = await import('/tests/audioLifecycle/fadeFixture.js');
    strict.mount();

    await until(() => strict.current()?.state() === 'loaded');

    const previous = strict.current();
    const play = previous.play(true);
    await wait(250);
    const oldVoices = Reflect.get(previous.howlInst, '_sounds');
    strict.replace('/tests/audioLifecycle/tone.wav?replacement');

    await until(() => strict.current() !== previous && strict.current()?.state() === 'loaded');

    const current = strict.current();
    await current.play();
    await previous.unload();
    await play;
    const replacement = readVoices(current);
    strict.unmount();
    await current.unload();
    await window.audioLifecycle.cleanup();
    await wait(100);

    return {
      oldState: previous.state(),
      newState: current.state(),
      oldFades: oldVoices.some((voice) => voice._interval),
      replacement,
      resources: window.audioLifecycle.resourceCount(),
    };
  });
  assert.equal(result.oldState, 'unloaded');
  assert.equal(result.newState, 'unloaded');
  assert.equal(result.oldFades, false);
  assert.equal(result.replacement.filter((voice) => voice.playing).length, 1);
  assert.equal(result.resources, 0);
});

test('cancelling faded play while loading settles its promise before the resource arrives', async (context) => {
  const page = await openAudio(context);
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/fade-loading.wav', async (route) => {
    await gate;
    await route.fulfill({
      path: fileURLToPath(new URL('./tone.wav', import.meta.url)),
      contentType: 'audio/wav',
    });
  });
  context.after(() => release());
  const cancelled = await page.evaluate(async () => {
    const fixture = window.audioLifecycle;
    const audio = fixture.create({ id: 'loading-fade', src: '/fade-loading.wav' });
    const fadeOut = audio.fadeOut();
    const play = audio.play(true);
    await audio.stop();
    await Promise.all([fadeOut, play]);

    return { playing: audio.playing(), queued: Reflect.get(audio.howlInst, '_queue').length };
  });
  assert.equal(cancelled.playing, false);
  assert.equal(cancelled.queued, 0);
  release();
  await page.waitForFunction(() => window.audioLifecycle.get('loading-fade').state() === 'loaded');
  const result = await page.evaluate(async () => {
    const { wait } = await import('/tests/audioLifecycle/fadeFixture.js');
    const fixture = window.audioLifecycle;
    const audio = fixture.get('loading-fade');
    const play = audio.play(true);
    await wait(250);
    const voices = Reflect.get(audio.howlInst, '_sounds');
    await audio.unload();
    await play;
    await fixture.cleanup();
    await wait(1100);

    return {
      state: audio.state(),
      fades: voices.some((voice) => voice._interval),
      events: fixture.events,
      resources: fixture.resourceCount(),
    };
  });
  assert.equal(result.state, 'unloaded');
  assert.equal(result.fades, false);
  assert.equal(result.events.filter((event) => event === 'play:loading-fade').length, 1);
  assert.equal(result.resources, 0);
});
