import { useEffect, useState } from 'react';

import type { HowlWrapper } from '@utils/effects/audio/HowlWrapper';

type Playback = 'loading' | 'failed' | 'ready' | 'playing';

export type AudioSample = {
  audio: HowlWrapper;
  instance: number;
  playback: Playback;
  relativeVolume: number;
  position?: number;
};

const instances = new WeakMap<HowlWrapper, number>();
let nextInstance = 0;

const getInstance = (audio: HowlWrapper) => {
  const existing = instances.get(audio);

  if (existing !== undefined) {
    return existing;
  }

  nextInstance += 1;
  instances.set(audio, nextInstance);

  return nextInstance;
};

const readSample = (audio: HowlWrapper): AudioSample => {
  const instance = getInstance(audio);
  const { relativeVolume } = audio;

  if (audio.loadOutcome === 'failed') {
    return {
      audio,
      instance,
      relativeVolume,
      playback: 'failed',
    };
  }

  if (audio.loadOutcome !== 'ready') {
    return {
      audio,
      instance,
      relativeVolume,
      playback: 'loading',
    };
  }

  const seek = audio.howlInst.seek();
  let position: number | undefined;
  let playback: Playback = 'ready';

  if (typeof seek === 'number' && Number.isFinite(seek)) {
    position = Math.floor(seek * 10) / 10;
  }

  if (audio.playing()) {
    playback = 'playing';
  }

  return {
    audio,
    instance,
    relativeVolume,
    playback,
    position,
  };
};

export const useAudioSample = (audio: HowlWrapper | null) => {
  const [sample, setSample] = useState<AudioSample | null>(null);

  useEffect(() => {
    if (!audio) {
      setSample(null);

      return;
    }

    const update = () => {
      const next = readSample(audio);
      setSample((previous) => {
        const isSameSample = previous?.audio === audio
          && previous.relativeVolume === next.relativeVolume
          && previous.playback === next.playback
          && previous.position === next.position;

        if (isSameSample) {
          return previous;
        }

        return next;
      });
    };

    update();
    const unsubscribe = audio.observeLoad(update);
    const timer = window.setInterval(update, 100);

    return () => {
      unsubscribe?.();
      window.clearInterval(timer);
    };
  }, [audio]);

  if (sample?.audio === audio) {
    return sample;
  }

  return null;
};
