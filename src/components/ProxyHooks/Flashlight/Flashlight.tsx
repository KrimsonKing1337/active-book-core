import type { FlashlightEffectOptions } from '@types';

import { useFlashlight } from '@hooks/effects/flashlight';

import { useAppMode } from '@components/App/AppModeContext';

export type FlashlightProps = FlashlightEffectOptions;

export const Flashlight = ({ playOnLoad, ...options }: FlashlightProps) => {
  const appMode = useAppMode();

  const playOnLoadAppMode = appMode === 'reader' ? playOnLoad : false;

  useFlashlight({
    ...options,
    playOnLoad: playOnLoadAppMode,
  });

  return null;
};
