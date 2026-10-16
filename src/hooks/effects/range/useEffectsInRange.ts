import type { RangeEffects } from '@types';

import { useBackgroundInRange } from './useBackgroundInRange';
import { useAudioInRange } from './useAudioInRange';
import { useDotsInRange } from './useDotsInRange';

export const useEffectsInRange = (effects: RangeEffects) => {
  useAudioInRange(effects);
  useDotsInRange(effects);
  useBackgroundInRange(effects);
};
