export const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

export const readVoices = (audio) => {
  return Reflect.get(audio.howlInst, '_sounds').map((sound) => ({
    id: sound._id,
    playing: !sound._paused,
    gain: sound._node.gain.value,
    fading: Boolean(sound._interval),
  }));
};

export const meter = () => {
  const { howler } = window.audioLifecycle;
  const analyser = howler.ctx.createAnalyser();
  analyser.fftSize = 1024;
  howler.masterGain.connect(analyser);
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
  };

  return { rms, close };
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
