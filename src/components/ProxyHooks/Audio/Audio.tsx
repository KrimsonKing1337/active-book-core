import type { AudioEffectOptions } from '@types';

import { useAudio } from '@hooks/effects/audio';

import { useAppMode } from '@components/App/AppModeContext';

export const Audio = ({
  playOnLoad,
  ...options
}: AudioEffectOptions) => {
  const appMode = useAppMode();

  const playOnLoadAppMode = appMode === 'reader' ? playOnLoad : false;

  useAudio({
    ...options,
    playOnLoad: playOnLoadAppMode,
  });

  return null;
};
