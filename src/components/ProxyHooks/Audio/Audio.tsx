import type { AudioEffectOptions } from '@types';

import { useAudio } from '@hooks/effects/audio';

export const Audio = (options: AudioEffectOptions) => {
  useAudio(options);

  return null;
};
