import { useCallback, useEffect } from 'react';

import type { VibrationEffectOptions } from '@types';

import { useSelector } from 'store';
import { configSelectors } from 'store/config';
import { mainSelectors } from 'store/main';

import { off as vibrationOff, on as vibrationOn } from 'utils/effects/vibration';

export function useVibration(options?: VibrationEffectOptions) {
  const currentPage = useSelector(mainSelectors.page);
  const isVibrationAvailable = useSelector(mainSelectors.isVibrationAvailable);
  const vibrationEnabled = useSelector(configSelectors.vibration);

  const id = options?.id;
  const page = options?.page;
  const duration = options?.duration ?? 0;
  const delay = options?.delay ?? 0;
  const playOnLoad = options?.playOnLoad ?? false;

  const on = useCallback((n: number) => {
    if (!isVibrationAvailable) {
      return;
    }

    if (document.hidden) {
      return;
    }

    vibrationOn(n);

    console.log(`___ vibrated: ${n}`);
  }, [isVibrationAvailable]);

  const off = useCallback(() => {
    if (!isVibrationAvailable) {
      return;
    }

    vibrationOff();
  }, [isVibrationAvailable]);

  // Keep the existing imperative useVibration() behavior: stop a running vibration on unmount
  useEffect(() => {
    return () => {
      off();
    };
  }, [off]);

  // Declarative behavior is available through both useVibration(options) and <Vibration />
  useEffect(() => {
    const isSamePage = currentPage === page;
    const canVibrate = isVibrationAvailable && vibrationEnabled;

    if (!id
      || !isSamePage
      || !playOnLoad
      || !canVibrate) {
      return;
    }

    if (duration <= 0) {
      return;
    }

    if (delay <= 0) {
      on(duration);

      return () => {
        off();
      };
    }

    const timer = window.setTimeout(() => {
      on(duration);
    }, delay);

    return () => {
      window.clearTimeout(timer);

      off();
    };
  }, [
    currentPage,
    isVibrationAvailable,
    vibrationEnabled,
    id,
    page,
    duration,
    delay,
    playOnLoad,
    on,
    off,
  ]);

  return {
    vibrationOff: off,
    vibrationOn: on,
  };
}
