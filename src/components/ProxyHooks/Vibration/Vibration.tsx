import { useEffect } from 'react';

import { useSelector } from 'store';
import { configSelectors } from 'store/config';
import { mainSelectors } from 'store/main';

import { useAppMode } from 'components/App/AppModeContext';

import { useVibration } from 'hooks/effects/vibration';

export type VibrationProps = {
  id: string;
  page: number;
  duration: number;
  delay?: number;
  playOnLoad?: boolean;
};

export const Vibration = ({
  id,
  page,
  duration,
  delay = 0,
  playOnLoad = false,
}: VibrationProps) => {
  const appMode = useAppMode();

  const currentPage = useSelector(mainSelectors.page);
  const isVibrationAvailable = useSelector(mainSelectors.isVibrationAvailable);
  const vibrationEnabled = useSelector(configSelectors.vibration);

  const { vibrationOn, vibrationOff } = useVibration();

  useEffect(() => {
    if (appMode !== 'reader' || currentPage !== page || !playOnLoad) {
      return;
    }

    if (!isVibrationAvailable || !vibrationEnabled || duration <= 0) {
      return;
    }

    if (delay <= 0) {
      vibrationOn(duration);

      return () => {
        vibrationOff();
      };
    }

    const timer = window.setTimeout(() => {
      vibrationOn(duration);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      vibrationOff();
    };
  }, [
    appMode,
    currentPage,
    id,
    page,
    duration,
    delay,
    playOnLoad,
    isVibrationAvailable,
    vibrationEnabled,
    vibrationOn,
    vibrationOff,
  ]);

  return null;
};
