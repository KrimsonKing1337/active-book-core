import type { VibrationEffectOptions } from '@types';

import { useVibration } from '@hooks/effects/useVibration';

import { useAppMode } from '@components/App/AppModeContext';

export type VibrationProps = VibrationEffectOptions;

export const Vibration = ({ playOnLoad, ...options }: VibrationProps) => {
  const appMode = useAppMode();

  const playOnLoadAppMode = appMode === 'reader' ? playOnLoad : false;

  useVibration({
    ...options,
    playOnLoad: playOnLoadAppMode,
  });

  return null;
};
