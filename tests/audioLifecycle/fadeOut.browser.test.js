import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openAudio } from './audioLifecycleFixture.js';

test('scoped fade honors duration, zero duration and equal endpoints without native intervals', async (context) => {
  const page = await openAudio(context);
  const result = await page.evaluate(async () => {
    const { wait, readVoices } = await import('/tests/audioLifecycle/fadeFixture.js');
    const fixture = window.audioLifecycle;
    const audio = fixture.get();
    audio.howlInst.loop(true);
    await audio.play();
    await wait(50);
    const soundId = readVoices(audio)[0].id;
    const start = performance.now();
    const fade = audio.fade({
      from: 1,
      to: 0.2,
      duration: 400,
      soundId,
    });
    await wait(200);
    const midpoint = readVoices(audio)[0].gain;
    const completed = await fade;
    const duration = performance.now() - start;
    await wait(30);
    const end = readVoices(audio)[0];
    await audio.fade({
      from: 0.2,
      to: 0,
      duration: 0,
      soundId,
    });
    await audio.fade({
      from: 0,
      to: 0,
      duration: 1000,
      soundId,
    });
    await wait(50);
    const silent = readVoices(audio)[0];
    await audio.unload();

    return {
      midpoint,
      completed,
      duration,
      end,
      silent,
      resources: fixture.resourceCount(),
    };
  });
  assert(result.midpoint > 0.4 && result.midpoint < 0.8);
  assert.equal(result.completed, true);
  assert(result.duration >= 380 && result.duration < 850);
  assert(Math.abs(result.end.gain - 0.2) < 1e-6);
  assert.equal(result.end.fading, false);
  assert.equal(result.silent.gain, 0);
  assert.equal(result.silent.fading, false);
  assert.equal(result.resources, 0);
});

test('pause and unload fade actual playing voices, while mixer edits cancel a pending stop', async (context) => {
  const page = await openAudio(context);
  const result = await page.evaluate(async () => {
    const { wait, readVoices } = await import('/tests/audioLifecycle/fadeFixture.js');
    const fixture = window.audioLifecycle;
    const audio = fixture.get();
    audio.howlInst.loop(true);
    await audio.play();
    const pause = audio.pause(true);
    await wait(500);
    const pausing = readVoices(audio)[0];
    await pause;
    const paused = audio.playing();
    await audio.play();
    const stop = audio.stop(true);
    await wait(250);
    fixture.store.dispatch(fixture.volumeActions.setGlobal(50));
    fixture.store.dispatch(fixture.volumeActions.setSfx(50));
    audio.relativeVolume = 50;
    audio.volume(audio.getVolumeByType() / 100);
    await stop;
    await wait(1100);
    const updated = readVoices(audio).find((voice) => voice.playing);
    audio.fadeOutWhenUnload = true;
    const unloading = audio.unload();
    await wait(500);
    const closing = readVoices(audio).find((voice) => voice.playing);
    await unloading;

    return {
      pausing,
      paused,
      updated,
      closing,
      resources: fixture.resourceCount(),
    };
  });
  assert.equal(result.pausing.playing, true);
  assert(result.pausing.gain > 0.3 && result.pausing.gain < 0.7);
  assert.equal(result.paused, false);
  assert(Math.abs(result.updated.gain - 0.125) < 1e-6);
  assert(result.closing.gain > 0 && result.closing.gain < result.updated.gain);
  assert.equal(result.resources, 0);
});
