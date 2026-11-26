import type { RootState } from '@store';

export const selectors = {
  inverseColorIsActive: (state: RootState) => state.effects.inverseColorIsActive,

  videosCurrentTime: (state: RootState) => state.effects.videosCurrentTime,
};
