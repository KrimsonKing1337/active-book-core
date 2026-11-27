import type {
  AudioEffect,
  EffectLifetime,
  PageRange,
} from '@active-book/types';

type RuntimeAudio = AudioEffect<number>;
export type AudioDescription = Required<RuntimeAudio>;

const normalizeLifetime = (lifetime: EffectLifetime): EffectLifetime => {
  if (lifetime.type === 'page') {
    return lifetime;
  }

  const sorted = [...lifetime.range].sort((first, second) => {
    return first.from - second.from;
  });

  const merged: PageRange[] = [];

  for (const current of sorted) {
    const previous = merged.at(-1);

    if (previous && current.from <= previous.to + 1) {
      previous.to = Math.max(previous.to, current.to);
    } else {
      merged.push({ ...current });
    }
  }

  const [onlyRange] = merged;

  if (merged.length === 1 && onlyRange.from === onlyRange.to) {
    return { type: 'page', page: onlyRange.from };
  }

  return { type: 'range', range: merged };
};

export const normalizeAudioDescription = ({
  id,
  src,
  lifetime,
  format = [],
  type = 'sfx',
  relativeVolume = 100,
  loop = false,
  screamer = false,
  playOnLoad = false,
  delay = 0,
  stopBy = 0,
  fadeIn = false,
  fadeOut = false,
  waitTillTheEnd = false,
}: RuntimeAudio): AudioDescription => {
  const lifetimeNormalized = normalizeLifetime(lifetime);

  return {
    id,
    src,
    lifetime: lifetimeNormalized,
    format,
    type,
    relativeVolume,
    loop,
    screamer,
    playOnLoad,
    delay,
    stopBy,
    fadeIn,
    fadeOut,
    waitTillTheEnd,
  };
};

export const describeAudio = ({
  relativeVolume: _relativeVolume,
  ...identity }: AudioDescription) => {
  return JSON.stringify(identity);
};
