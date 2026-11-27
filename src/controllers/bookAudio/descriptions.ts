import type { VisualEffectLifetime } from '@active-book/types';

import type { AudioEffectOptions } from '@types';

type AudioDescriptionExcludedKeys = 'page' | 'lifecycle' | 'fadeOutWhenUnload';

export type AudioDescription = Omit<AudioEffectOptions, AudioDescriptionExcludedKeys> & {
  lifetime: VisualEffectLifetime;
  fadeIn?: boolean;
  fadeOut?: boolean;
  waitTillTheEnd?: boolean;
};

export type PageAudioDescription = AudioDescription & {
  pageId?: string | null;
};

export const describeAudio = (description: PageAudioDescription) => {
  const { lifetime } = description;

  let pages: number | number[][];

  if (lifetime.type === 'page') {
    pages = lifetime.page;
  } else {
    pages = lifetime.range.map(({ from, to }) => [from, to]);
  }

  return JSON.stringify([
    description.id,
    description.pageId,
    pages,
    description.src,
    description.format,
    description.type ?? 'sfx',
    description.loop ?? false,
    description.screamer ?? false,
    description.playOnLoad ?? false,
    description.delay ?? 0,
    description.stopBy ?? 0,
    description.fadeIn ?? false,
    description.fadeOut ?? false,
    description.waitTillTheEnd ?? false,
  ]);
};
