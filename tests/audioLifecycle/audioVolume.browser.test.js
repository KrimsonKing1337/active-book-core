import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openAudio } from './audioLifecycleFixture.js';

test('real Howler gains and native video share the full volume matrix on creation and updates', async (context) => {
  const page = await openAudio(context);
  await page.evaluate(async () => {
    const fixture = window.audioLifecycle;
    fixture.get().howlInst.loop(true);
    fixture.create({
      id: 'bg',
      type: 'bg',
      loop: true,
    });
    fixture.create({
      id: 'music',
      type: 'music',
      loop: true,
    });

    for (const id of [
      'audio',
      'bg',
      'music',
    ]) {
      const audio = fixture.get(id);
      fixture.store.dispatch(fixture.audioEffectsActions.setAudioInstance(audio));
      await audio.play();
    }

    await fixture.get().play();
  });
  await page.waitForFunction(() => window.audioLifecycle.events.length === 4);
  const result = await page.evaluate(async () => {
    const { readVolumeMatrix } = await import('/tests/audioLifecycle/volumeMatrixFixture.js');

    return readVolumeMatrix();
  });
  assert.equal(result.checked, 960);
  assert.deepEqual(result.failures, []);
  assert.equal(result.resources, 0);
});

test('loading uses the latest volume and disposed callbacks cannot affect its replacement', async (context) => {
  const page = await openAudio(context);
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/volume-loading.wav', async (route) => {
    await gate;
    await route.fulfill({ path: new URL('./tone.wav', import.meta.url).pathname, contentType: 'audio/wav' });
  });
  context.after(() => release());
  await page.evaluate(async () => {
    const fixture = window.audioLifecycle;
    const old = fixture.create({
      id: 'old',
      src: '/volume-loading.wav',
      relativeVolume: 50,
    });
    fixture.store.dispatch(fixture.audioEffectsActions.setAudioInstance(old));
    await old.play();
    await old.unload();
    const replacement = fixture.create({
      id: 'replacement',
      src: '/volume-loading.wav',
      relativeVolume: 25,
    });
    fixture.store.dispatch(fixture.audioEffectsActions.setAudioInstance(replacement));
    fixture.store.dispatch(fixture.volumeActions.setSfx(50));
    fixture.store.dispatch(fixture.volumeActions.setGlobal(25));
    setTimeout(() => old.volume(1), 100);
    await replacement.play();
  });
  release();
  await page.waitForFunction(() => window.audioLifecycle.events.includes('play:replacement'));
  await page.waitForTimeout(150);
  const state = await page.evaluate(async () => {
    const fixture = window.audioLifecycle;
    const old = fixture.get('old');
    const actual = fixture.get('replacement').howlInst.volume();
    const oldQueue = Reflect.get(old.howlInst, '_queue').length;
    const oldState = old.state();
    await fixture.cleanup('replacement');
    await fixture.cleanup();

    return {
      actual,
      oldQueue,
      oldState,
      resources: fixture.resourceCount(),
    };
  });
  assert.equal(state.actual, 0.03125);
  assert.equal(state.oldQueue, 0);
  assert.equal(state.oldState, 'unloaded');
  assert.equal(state.resources, 0);
});
