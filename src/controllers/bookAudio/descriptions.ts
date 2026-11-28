import type {
  AudioEffect,
  EffectLifetime,
  PageRange,
} from '@active-book/types';

import { assertAudioRelativeVolume, DEFAULT_AUDIO_RELATIVE_VOLUME } from '@@/audioVolume';

type RuntimeAudio = AudioEffect<number>;
export type AudioDescription = Required<RuntimeAudio>;

const normalizeLifetime = (lifetime: EffectLifetime): EffectLifetime => {
  if (lifetime.type === 'page') {
    return {
      type: 'page',
      page: lifetime.page,
    };
  }

  const sortedRanges = [...lifetime.range].sort((first, second) => {
    return first.from - second.from;
  });

  const mergedRanges: PageRange[] = [];

  for (const rangeCur of sortedRanges) {
    const previousRange = mergedRanges.at(-1);

    if (previousRange && rangeCur.from <= previousRange.to + 1) {
      previousRange.to = Math.max(previousRange.to, rangeCur.to);
    } else {
      const { from, to } = rangeCur;

      mergedRanges.push({ from, to });
    }
  }

  const [onlyRange] = mergedRanges;

  if (mergedRanges.length === 1 && onlyRange.from === onlyRange.to) {
    return { type: 'page', page: onlyRange.from };
  }

  return { type: 'range', range: mergedRanges };
};

export const normalizeAudioDescription = ({
  id,
  src,
  lifetime,
  format = [],
  type = 'sfx',
  relativeVolume = DEFAULT_AUDIO_RELATIVE_VOLUME,
  loop = false,
  playOnLoad = false,
  delay = 0,
  stopBy = 0,
  fadeIn = false,
  fadeOut = false,
  waitTillTheEnd = false,
}: RuntimeAudio): AudioDescription => {
  assertAudioRelativeVolume(relativeVolume);
  const normalizedLifetime = normalizeLifetime(lifetime);

  return {
    id,
    src,
    lifetime: normalizedLifetime,
    format,
    type,
    relativeVolume,
    loop,
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
  ...identity
}: AudioDescription) => {
  return JSON.stringify(identity);
};
