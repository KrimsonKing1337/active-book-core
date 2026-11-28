export const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

export const readVoices = (audio) => {
  return Reflect.get(audio.howlInst, '_sounds').map((sound) => ({
    id: sound._id,
    playing: !sound._paused,
    gain: sound._node.gain?.value ?? sound._node.volume,
    fading: Boolean(sound._interval),
  }));
};

export const meter = () => {
  const { howler } = window.audioLifecycle;
  const analyser = howler.ctx.createAnalyser();
  const silentOutput = howler.ctx.createGain();
  analyser.fftSize = 1024;
  silentOutput.gain.value = 0;
  howler.masterGain.connect(analyser);
  analyser.connect(silentOutput).connect(howler.ctx.destination);
  const samples = new Float32Array(analyser.fftSize);
  const rms = () => {
    analyser.getFloatTimeDomainData(samples);
    let energy = 0;

    for (const sample of samples) {
      energy += sample * sample;
    }

    return Math.sqrt(energy / samples.length);
  };
  const close = () => {
    howler.masterGain.disconnect(analyser);
    analyser.disconnect();
    silentOutput.disconnect();
  };

  return { rms, close, windowDuration: analyser.fftSize / howler.ctx.sampleRate };
};

export const until = async (predicate) => {
  const deadline = performance.now() + 5000;

  while (!predicate()) {
    if (performance.now() >= deadline) {
      throw new Error('Audio fixture did not reach the expected state');
    }

    await wait(10);
  }
};

/** Samples on the audio thread so main-thread timers cannot move the measurement window. */
export const timedMeter = async () => {
  const { ctx, masterGain } = window.audioLifecycle.howler;
  const moduleUrl = new URL('./fadeProbe.worklet.js', import.meta.url);
  await ctx.audioWorklet.addModule(moduleUrl);
  const probe = new AudioWorkletNode(ctx, 'active-book-fade-probe', { channelCount: 1 });
  const blocks = [];
  let recordedUntil = 0;

  probe.port.onmessage = ({ data }) => {
    const { frame, count, energy } = data;
    const time = (frame + count / 2) / ctx.sampleRate;
    blocks.push({ time, count, energy });
    recordedUntil = (frame + count) / ctx.sampleRate;
  };

  masterGain.connect(probe);
  probe.connect(ctx.destination);

  return {
    waitFor: (time) => until(() => recordedUntil >= time),
    rms: (from, to) => {
      let energy = 0;
      let sampleCount = 0;

      for (const blockCur of blocks) {
        if (blockCur.time >= from && blockCur.time < to) {
          energy += blockCur.energy;
          sampleCount += blockCur.count;
        }
      }

      if (!sampleCount) {
        throw new Error('Audio probe has no samples in the requested time window');
      }

      return Math.sqrt(energy / sampleCount);
    },
    close: () => {
      masterGain.disconnect(probe);
      probe.disconnect();
      probe.port.close();
    },
  };
};
