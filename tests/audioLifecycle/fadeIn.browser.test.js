import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openAudio } from './audioLifecycleFixture.js';

test('fade-in raises the gain and measured audio signal of a playing voice', async (context) => {
  const page = await openAudio(context);
  const result = await page.evaluate(async () => {
    const {
      wait,
      readVoices,
      meter,
    } = await import('/tests/audioLifecycle/fadeFixture.js');
    const fixture = window.audioLifecycle;
    const audio = fixture.get();
    audio.howlInst.loop(true);
    const probe = meter();
    const start = performance.now();
    const play = audio.play(true);
    await wait(100);
    const early = { voice: readVoices(audio)[0], rms: probe.rms() };
    await wait(400);
    const middle = { voice: readVoices(audio)[0], rms: probe.rms() };
    await play;
    const duration = performance.now() - start;
    await wait(50);
    const end = { voice: readVoices(audio)[0], rms: probe.rms() };
    probe.close();
    await audio.unload();

    return {
      early,
      middle,
      end,
      duration,
      resources: fixture.resourceCount(),
    };
  });
  assert.equal(result.early.voice.playing, true);
  assert(result.early.voice.gain > 0 && result.early.voice.gain < 0.3);
  assert(result.middle.voice.gain > 0.35 && result.middle.voice.gain < 0.8);
  assert.equal(result.end.voice.gain, 1);
  assert(result.early.rms > 0);
  assert(result.middle.rms > result.early.rms * 2);
  assert(result.end.rms > result.middle.rms * 1.3);
  assert(result.duration >= 950 && result.duration < 1800);
  assert.equal(result.resources, 0);
});

test('overlapping fade-ins and a new play during fade-out preserve all voices', async (context) => {
  const page = await openAudio(context);
  const result = await page.evaluate(async () => {
    const { wait, readVoices } = await import('/tests/audioLifecycle/fadeFixture.js');
    const fixture = window.audioLifecycle;
    const audio = fixture.get();
    audio.howlInst.loop(true);
    const first = audio.play(true);
    await wait(250);
    const second = audio.play(true);
    await audio.play();
    await wait(250);
    const overlapping = readVoices(audio);
    const stop = audio.stop(true);
    await wait(250);
    const fadingOut = readVoices(audio);
    await audio.play();
    await Promise.all([
      first,
      second,
      stop,
    ]);
    await wait(1100);
    const restored = readVoices(audio);
    await audio.unload();

    return {
      overlapping,
      fadingOut,
      restored,
      resources: fixture.resourceCount(),
    };
  });
  assert.equal(result.overlapping.filter((voice) => voice.playing).length, 3);
  assert(result.overlapping[0].gain > result.overlapping[1].gain);
  assert.equal(result.overlapping[2].gain, 1);
  for (let index = 0; index < 3; index += 1) {
    assert(result.fadingOut[index].gain < result.overlapping[index].gain);
  }
  assert.equal(result.restored.filter((voice) => voice.playing).length, 4);
  assert(result.restored.every((voice) => voice.gain === 1 && !voice.fading));
  assert.equal(result.resources, 0);
});

test('delay and stopBy surround the audible fade without moving their command deadlines', async (context) => {
  const page = await openAudio(context);
  const result = await page.evaluate(async () => {
    const { wait, readVoices } = await import('/tests/audioLifecycle/fadeFixture.js');
    const fixture = window.audioLifecycle;
    const audio = fixture.get();
    audio.howlInst.loop(true);
    audio.delay = 200;
    audio.stopBy = 600;
    const play = audio.play(true);
    await wait(100);
    const before = readVoices(audio);
    await wait(250);
    const during = readVoices(audio);
    await play;
    const stopped = readVoices(audio);
    await wait(1100);
    const after = readVoices(audio);
    await audio.unload();

    return {
      before,
      during,
      stopped,
      after,
      resources: fixture.resourceCount(),
    };
  });
  assert(result.before.every((voice) => !voice.playing && !voice.fading));
  assert.equal(result.during.filter((voice) => voice.playing).length, 1);
  assert(result.during[0].gain > 0 && result.during[0].gain < 0.5);
  assert(result.stopped.every((voice) => !voice.playing && !voice.fading));
  assert(result.after.every((voice) => !voice.playing && !voice.fading));
  assert.equal(result.resources, 0);
});
