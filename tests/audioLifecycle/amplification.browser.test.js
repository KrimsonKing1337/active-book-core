import assert from 'node:assert/strict';
import { test } from 'node:test';

import { webkit } from 'playwright';

import { openAudio } from './audioLifecycleFixture.js';

const compare = (actual, expected, label, tolerance = 0.04) => {
  assert(Math.abs(actual - expected) < tolerance, `${label}: ${actual} != ${expected}`);
};

const getBrowser = () => {
  if (process.env.PLAYWRIGHT_AUDIO_BROWSER === 'webkit') {
    return webkit;
  }

  return undefined;
};

const browser = getBrowser();

test('Web Audio measures amplification, independent voices, mixer mutes and disposal', async (context) => {
  const page = await openAudio(context, { browserType: browser });
  const result = await page.evaluate(async () => {
    const { timedMeter, until } = await import('/tests/audioLifecycle/fadeFixture.js');
    const fixture = window.audioLifecycle;
    const { ctx } = fixture.howler;
    const audio = fixture.get();
    fixture.store.dispatch(fixture.audioEffectsActions.setAudioInstance(audio));
    audio.howlInst.loop(true);
    const probe = await timedMeter();

    const read = async () => {
      const from = ctx.currentTime + 0.025;
      const to = from + 0.065;
      await probe.waitFor(to);

      return probe.rms(from, to);
    };

    audio.setRelativeVolume(50);
    await audio.play();
    const half = await read();
    audio.setRelativeVolume(100);
    const baseline = await read();
    const ratios = [half / baseline, 1];

    for (const percent of [150, 200]) {
      audio.setRelativeVolume(percent);
      ratios.push(await read() / baseline);
    }

    const normal = fixture.create({ id: 'normal', loop: true });
    await until(() => normal.loadOutcome === 'ready');
    await audio.pause();
    audio.setRelativeVolume(150);
    await normal.play();
    const independent = await read() / baseline;
    await normal.unload();
    await audio.play();
    const resumed = await read() / baseline;
    await audio.play();
    const voices = Reflect.get(audio.howlInst, '_sounds').filter((sound) => !sound._paused);
    const output = Reflect.get(Reflect.get(audio, 'gain'), 'output');
    const secondVoice = voices[1]._id;
    // Distinct frequencies give a predictable RMS sum independently of the relative phase.
    audio.howlInst.rate(2, secondVoice);
    const multiple = await read() / baseline;
    audio.setRelativeVolume(200);
    const bothBoosted = await read() / baseline;
    fixture.store.dispatch(fixture.volumeActions.setGlobal(50));
    fixture.store.dispatch(fixture.volumeActions.setSfx(50));
    const mixed = await read() / bothBoosted / baseline;
    fixture.store.dispatch(fixture.volumeActions.setGlobal(0));
    const globalMute = await read();
    fixture.store.dispatch(fixture.volumeActions.setGlobal(100));
    fixture.store.dispatch(fixture.volumeActions.setSfx(0));
    const categoryMute = await read();
    fixture.store.dispatch(fixture.volumeActions.setSfx(100));
    await audio.stop();
    await audio.play();
    const reused = Reflect.get(Reflect.get(audio, 'gain'), 'output') === output;
    const restarted = await read() / baseline;
    const disconnect = output.disconnect.bind(output);
    let outputDisconnected = false;
    output.disconnect = () => {
      outputDisconnected = true;
      disconnect();
    };
    await audio.unload({ immediate: true });
    const disposed = Reflect.get(Reflect.get(audio, 'gain'), 'output') === undefined
      && !Object.hasOwn(audio.howlInst, '_refreshBuffer');
    const afterUnload = await read();
    probe.close();

    return {
      baseline,
      ratios,
      independent,
      resumed,
      multiple,
      bothBoosted,
      mixed,
      globalMute,
      categoryMute,
      restarted,
      reused,
      disposed,
      outputDisconnected,
      afterUnload,
      resources: fixture.resourceCount(),
    };
  });
  context.diagnostic(JSON.stringify(result));
  assert(result.baseline > 0 && result.baseline < 0.15);
  for (const [index, expected] of [0.5, 1, 1.5, 2].entries()) {
    compare(result.ratios[index], expected, `relative ${expected * 100}%`);
  }
  compare(result.independent, 1, 'ordinary instance using the same source');
  compare(result.resumed, 1.5, 'resumed');
  compare(result.multiple, Math.SQRT2 * 1.5, 'two voices');
  compare(result.bothBoosted, Math.SQRT2 * 2, 'both voices updated');
  compare(result.mixed, 0.25, 'global and category at 50%');
  assert.equal(result.globalMute, 0);
  assert.equal(result.categoryMute, 0);
  compare(result.restarted, 2, 'restarted');
  assert.equal(result.reused, true);
  assert.equal(result.disposed, true);
  assert.equal(result.outputDisconnected, true);
  assert.equal(result.afterUnload, 0);
  assert.equal(result.resources, 0);
});

test('relative gain changes during steady playback and during both native fades', async (context) => {
  const page = await openAudio(context, { browserType: browser });
  const result = await page.evaluate(async () => {
    const { timedMeter } = await import('/tests/audioLifecycle/fadeFixture.js');
    const fixture = window.audioLifecycle;
    const { ctx } = fixture.howler;
    const audio = fixture.get();
    audio.howlInst.loop(true);
    await audio.play();
    const signal = await timedMeter();
    const voice = Reflect.get(audio.howlInst, '_sounds').find((sound) => !sound._paused);
    const source = voice._node.bufferSource;
    const start = ctx.currentTime;
    await signal.waitFor(start + 0.14);
    const baseline = signal.rms(start + 0.05, start + 0.14);
    const changes = [
      50,
      150,
      50,
      100,
      200,
      100,
      200,
      0,
      200,
    ];
    const duration = 1700;
    const results = [];

    for (const mode of ['steady', 'in', 'out']) {
      audio.setRelativeVolume(100);
      let fade;
      const wallStart = performance.now();

      if (mode === 'in') {
        fade = audio.fade({ from: 0, to: 1, duration, soundId: voice._id });
      }

      if (mode === 'out') {
        fade = audio.fade({ from: 1, to: 0, duration, soundId: voice._id });
      }

      const fadeAt = ctx.currentTime;
      const gainAt = (at) => {
        const progress = (at - fadeAt) / (duration / 1000);

        if (mode === 'in') {
          return progress;
        }

        if (mode === 'out') {
          return 1 - progress;
        }

        return 1;
      };

      await signal.waitFor(fadeAt + 0.23);
      let previous = 100;

      for (const percent of changes) {
        audio.setRelativeVolume(percent);
        const at = ctx.currentTime;
        await signal.waitFor(at + 0.088);
        const from = at + 0.035;
        const to = at + 0.085;
        const measured = signal.rms(from, to) / baseline;
        const expected = gainAt((from + to) / 2) * percent / 100;
        const end = at + 0.025;
        const boundary = signal.maxBlockRms(at - 0.015, end) / baseline;
        const maxGain = Math.max(gainAt(at - 0.015), gainAt(end));
        const maxExpected = maxGain * Math.max(percent, previous) / 100;
        results.push({
          mode,
          previous,
          percent,
          measured,
          expected,
          boundary,
          maxExpected,
        });
        previous = percent;
      }

      if (fade) {
        const completed = await fade;
        results.push({
          mode,
          completed,
          elapsed: performance.now() - wallStart,
          sameVoice: voice._node.bufferSource === source,
        });
      }
    }

    signal.close();
    await audio.unload();

    return results;
  });

  for (const sample of result) {
    if ('completed' in sample) {
      assert.equal(sample.completed, true);
      assert.equal(sample.sameVoice, true);
      assert(sample.elapsed >= 1690 && sample.elapsed < 1950, JSON.stringify(sample));
    } else {
      assert(sample.expected >= 0, JSON.stringify(sample));
      compare(sample.measured, sample.expected, JSON.stringify(sample), 0.10);
      // A 128-frame block spans less than one cycle in some contexts, which varies block RMS.
      assert(sample.boundary <= sample.maxExpected * 1.13 + 0.055, JSON.stringify(sample));
    }
  }
});

test('HTML5 Audio preserves the author value and limits playback to unity', async (context) => {
  const page = await openAudio(context, { html5: true });
  const result = await page.evaluate(async () => {
    const { readVoices, until } = await import('/tests/audioLifecycle/fadeFixture.js');
    const fixture = window.audioLifecycle;
    const audio = fixture.get();
    fixture.store.dispatch(fixture.audioEffectsActions.setAudioInstance(audio));
    audio.setRelativeVolume(200);
    await audio.play();
    await until(() => fixture.events.includes('play:audio'));
    const gain = () => readVoices(audio).find((voice) => voice.playing).gain;
    const levels = [gain()];
    audio.setRelativeVolume(50);
    levels.push(gain());
    audio.setRelativeVolume(150);
    levels.push(gain());
    fixture.store.dispatch(fixture.volumeActions.setGlobal(50));
    fixture.store.dispatch(fixture.volumeActions.setSfx(50));
    levels.push(gain());
    fixture.store.dispatch(fixture.volumeActions.setSfx(0));
    levels.push(gain());
    fixture.store.dispatch(fixture.volumeActions.setSfx(100));
    fixture.store.dispatch(fixture.volumeActions.setGlobal(0));
    levels.push(gain());
    await audio.pause();
    audio.setRelativeVolume(200);
    fixture.store.dispatch(fixture.volumeActions.setGlobal(100));
    await audio.play();
    await until(() => fixture.events.length === 2);
    levels.push(gain());
    const author = audio.relativeVolume;
    const html5 = !fixture.howler.usingWebAudio;
    const output = Reflect.get(Reflect.get(audio, 'gain'), 'output');
    await audio.unload();

    return { levels, author, html5, output, resources: fixture.resourceCount() };
  });
  assert.deepEqual(result.levels, [
    1,
    0.5,
    1,
    0.25,
    0,
    0,
    1,
  ]);
  assert.equal(result.author, 200);
  assert.equal(result.html5, true);
  assert.equal(result.output, undefined);
  assert.equal(result.resources, 0);
});

test('an incompatible voice route falls back to unity and reports the failure once', async (context) => {
  const page = await openAudio(context, { browserType: browser });
  const messages = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().includes('incompatible Howler voice route')) {
      messages.push(message.text());
    }
  });
  const result = await page.evaluate(async () => {
    const { timedMeter, until } = await import('/tests/audioLifecycle/fadeFixture.js');
    const fixture = window.audioLifecycle;
    const { ctx } = fixture.howler;
    const probe = await timedMeter();
    const read = async () => {
      const at = ctx.currentTime;
      await probe.waitFor(at + 0.1);

      return probe.rms(at + 0.03, at + 0.1);
    };

    const audio = fixture.get();
    await audio.play();
    const baseline = await read();
    await audio.unload();

    const NativeGainNode = window.GainNode;
    window.GainNode = class DisabledGainNode {};
    const ratios = [];

    try {
      for (const id of ['first', 'second']) {
        const fallback = fixture.create({ id, relativeVolume: 200 });
        await until(() => fallback.loadOutcome === 'ready');
        await fallback.play();
        ratios.push(await read() / baseline);
        await fallback.unload();
      }
    } finally {
      window.GainNode = NativeGainNode;
      probe.close();
    }

    return { ratios, resources: fixture.resourceCount() };
  });

  for (const ratio of result.ratios) {
    compare(ratio, 1, 'incompatible route uses unity gain');
  }

  assert.equal(messages.length, 1);
  assert.equal(result.resources, 0);
});
