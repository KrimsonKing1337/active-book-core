import type { RangeEffects } from '@types';

import { useAudioInRange } from './useAudioInRange';

export const useEffectsInRange = (effects: RangeEffects) => {
  useAudioInRange(effects);
};
