import type { AudioEffectOptions } from '@types';

import { useAppMode } from 'components/App/AppModeContext';

import { useAudio } from 'hooks/effects/audio';

export const Audio = ({ playOnLoad, ...options }: AudioEffectOptions) => {
  const appMode = useAppMode();

  useAudio({
    ...options,
    playOnLoad: appMode === 'reader' ? playOnLoad : false,
  });

  return null;
};
