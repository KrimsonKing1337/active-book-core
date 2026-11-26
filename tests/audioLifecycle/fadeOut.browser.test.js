import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openAudio } from './audioLifecycleFixture.js';

test('scoped fade honors duration, zero duration and equal endpoints without native intervals', async (context) => {
  const page = await openAudio(context);
  const result = await page.evaluate(async () => {
    const {
      wait,
      readVoices,
      until,
    } = await import('/tests/audioLifecycle/fadeFixture.js');
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
    await until(() => Math.abs(readVoices(audio)[0].gain - 0.2) < 1e-6);
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
    await until(() => readVoices(audio)[0].gain === 0);
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

test('mixer updates preserve the real fade signal and the pending stop deadline', async (context) => {
  const page = await openAudio(context);
  const result = await page.evaluate(async () => {
    const {
      wait,
      readVoices,
      meter,
      until,
    } = await import('/tests/audioLifecycle/fadeFixture.js');
    const fixture = window.audioLifecycle;
    const audio = fixture.get();
    fixture.store.dispatch(fixture.audioEffectsActions.setAudioInstance(audio));
    audio.howlInst.loop(true);
    const signal = meter();
    const play = async () => {
      const count = fixture.events.filter((event) => event === 'play:audio').length;
      await audio.play();
      await until(() => fixture.events.filter((event) => event === 'play:audio').length > count);
    };
    await play();
    await until(() => signal.rms() > 0.001);
    const audioClock = fixture.howler.ctx;
    const baselineTime = audioClock.currentTime + signal.windowDuration;
    await until(() => audioClock.currentTime >= baselineTime);
    const baseline = signal.rms();
    const start = performance.now();
    const stop = audio.stop(true);
    await wait(250);
    fixture.store.dispatch(fixture.volumeActions.setGlobal(50));
    fixture.store.dispatch(fixture.volumeActions.setSfx(50));
    audio.relativeVolume = 50;
    audio.volume(audio.getVolumeByType() / 100);
    await wait(250);
    const midpoint = signal.rms() / baseline;
    await stop;
    const elapsed = performance.now() - start;
    const stopped = !audio.playing();
    await play();
    const pause = audio.pause(true);
    await until(() => {
      const voice = readVoices(audio).find((voice) => voice.playing);

      return voice && voice.gain > 0 && voice.gain < 0.09;
    });
    const pausing = readVoices(audio).find((voice) => voice.playing);
    await pause;
    const paused = audio.playing();
    await play();
    audio.fadeOutWhenUnload = true;
    fixture.store.dispatch(fixture.audioEffectsActions.removeAudioInstance({ id: audio.id, instance: audio }));
    const unloading = audio.unload();
    await wait(250);
    fixture.store.dispatch(fixture.volumeActions.setGlobal(25));
    await wait(250);
    const closing = readVoices(audio).find((voice) => voice.playing);
    await unloading;
    signal.close();

    return {
      pausing,
      paused,
      midpoint,
      baseline,
      elapsed,
      stopped,
      closing,
      resources: fixture.resourceCount(),
    };
  });
  context.diagnostic(JSON.stringify({
    signalRatio: result.midpoint,
    baseline: result.baseline,
    stopMs: result.elapsed,
    unloadGain: result.closing?.gain,
  }));
  assert.equal(result.pausing.playing, true);
  assert(result.pausing.gain > 0 && result.pausing.gain < 0.09);
  assert.equal(result.paused, false);
  assert(result.midpoint > 0.035 && result.midpoint < 0.09);
  assert(result.elapsed >= 980 && result.elapsed < 1200);
  assert.equal(result.stopped, true);
  assert(result.closing.gain > 0.015 && result.closing.gain < 0.05);
  assert.equal(result.resources, 0);
});

test('shortening and reversing a fade hold the signal and reuse the same playing voice', async (context) => {
  const page = await openAudio(context);
  const result = await page.evaluate(async () => {
    const {
      wait,
      readVoices,
      meter,
      until,
    } = await import('/tests/audioLifecycle/fadeFixture.js');
    const fixture = window.audioLifecycle;
    const audio = fixture.get();
    const audioClock = fixture.howler.ctx;
    const signal = meter();
    const nextSignal = async () => {
      const at = audioClock.currentTime;
      await until(() => audioClock.currentTime >= at + 0.024);

      // RMS covers the preceding sample window, centered shortly before this reading.
      const elapsed = audioClock.currentTime - at - signal.windowDuration / 2;

      return { rms: signal.rms(), elapsed };
    };
    audio.howlInst.loop(true);
    await audio.play();
    await until(() => fixture.events.includes('play:audio'));
    const id = readVoices(audio)[0].id;
    await until(() => signal.rms() > 0.001);
    const { rms: baseline } = await nextSignal();

    const fade = audio.fadeOut();
    await wait(300);
    const beforeShorten = signal.rms();
    const start = performance.now();
    audio.shortenFadeOut(100);
    const afterShorten = await nextSignal();
    const shortened = await fade;
    const shortenedMs = performance.now() - start;
    await until(() => signal.rms() < baseline * 0.005);

    await audio.restoreFadeIn(0);
    const previous = audio.fadeOut();
    await wait(300);
    const beforeReverse = signal.rms();
    const positionBefore = audio.howlInst.seek(id);
    const restore = audio.restoreFadeIn(250);
    const afterReverse = await nextSignal();
    const positionAfter = audio.howlInst.seek(id);
    const previousResult = await previous;
    const restored = await restore;
    await nextSignal();
    const restoredSignal = signal.rms();
    const voices = readVoices(audio);
    const plays = fixture.events.filter((event) => event === 'play:audio').length;
    signal.close();
    await audio.unload({ immediate: true });

    return {
      shortened,
      shortenedMs,
      shortenRatio: afterShorten.rms / beforeShorten,
      expectedShortenRatio: Math.max(0, 1 - afterShorten.elapsed / 0.1),
      previousResult,
      restored,
      reverseRatio: afterReverse.rms / beforeReverse,
      expectedReverseRatio: 1 + (baseline / beforeReverse - 1) * Math.min(1, afterReverse.elapsed / 0.25),
      recovery: restoredSignal / baseline,
      positionDelta: positionAfter - positionBefore,
      voices,
      id,
      plays,
      resources: fixture.resourceCount(),
    };
  });
  context.diagnostic(JSON.stringify({
    shortenRatio: result.shortenRatio,
    expectedShortenRatio: result.expectedShortenRatio,
    shortenedMs: result.shortenedMs,
    reverseRatio: result.reverseRatio,
    expectedReverseRatio: result.expectedReverseRatio,
    recovery: result.recovery,
    positionDelta: result.positionDelta,
  }));
  assert.equal(result.shortened, true);
  assert(result.shortenedMs >= 90 && result.shortenedMs < 220);
  assert(Math.abs(result.shortenRatio - result.expectedShortenRatio) < 0.18);
  assert.equal(result.previousResult, false);
  assert.equal(result.restored, true);
  assert(Math.abs(result.reverseRatio - result.expectedReverseRatio) < 0.14);
  assert(result.recovery > 0.92 && result.recovery < 1.08);
  assert(result.positionDelta > 0 && result.positionDelta < 0.15);
  assert.equal(result.plays, 1);
  assert.deepEqual(result.voices.map(({ id, playing }) => ({ id, playing })), [{ id: result.id, playing: true }]);
  assert.equal(result.resources, 0);
});
