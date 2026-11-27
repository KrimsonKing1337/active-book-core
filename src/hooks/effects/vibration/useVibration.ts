import { useCallback, useEffect } from 'react';

import type { VibrationEffectOptions } from '@types';

import { useSelector } from '@store';

import { configSelectors } from '@store/config';
import { mainSelectors } from '@store/main';

import { useCanStartPageEffects, usePagePresented } from '@hooks/pagePresentation/context';

import { useAppMode } from '@components/App/AppModeContext';

import { off as vibrationOff, on as vibrationOn } from '@utils/effects/vibration';

import { useVibrationPreview } from './useVibrationPreview';

export const useVibration = (options?: VibrationEffectOptions) => {
  const appMode = useAppMode();
  const { start: startPreview, stop: stopPreview } = useVibrationPreview();
  const canStart = useCanStartPageEffects();
  const presented = usePagePresented();

  const currentPage = useSelector(mainSelectors.page);
  const isVibrationAvailable = useSelector(mainSelectors.isVibrationAvailable);
  const vibrationEnabled = useSelector(configSelectors.vibration);

  const id = options?.id;
  const page = options?.page;
  const duration = options?.duration ?? 0;
  const delay = options?.delay ?? 0;
  const playOnLoad = options?.playOnLoad ?? false;

  const on = useCallback((n: number) => {
    if (document.hidden) {
      return;
    }

    startPreview(n);

    // The editor can preview vibration without a supported device.
    // Reader-mode imperative calls retain their existing behavior.
    const canVibrate = isVibrationAvailable && (appMode !== 'editor' || vibrationEnabled);

    if (canVibrate) {
      vibrationOn(n);
    }
  }, [
    appMode,
    isVibrationAvailable,
    vibrationEnabled,
    startPreview,
  ]);

  const off = useCallback(() => {
    stopPreview();

    if (isVibrationAvailable) {
      vibrationOff();
    }
  }, [isVibrationAvailable, stopPreview]);

  // Keep the existing imperative useVibration() behavior: stop a running vibration on unmount
  useEffect(() => {
    return () => {
      off();
    };
  }, [off]);

  // Declarative behavior is available through both useVibration(options) and <Vibration />
  useEffect(() => {
    if (!presented) {
      return;
    }

    if (!canStart() || !id) {
      return;
    }

    if (currentPage !== page || !playOnLoad) {
      return;
    }

    if (!isVibrationAvailable || !vibrationEnabled) {
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
      if (canStart()) {
        on(duration);
      }
    }, delay);

    return () => {
      window.clearTimeout(timer);

      off();
    };
  }, [
    currentPage,
    presented,
    isVibrationAvailable,
    vibrationEnabled,
    id,
    page,
    duration,
    delay,
    playOnLoad,
    canStart,
    on,
    off,
  ]);

  return {
    vibrationOff: off,
    vibrationOn: on,
  };
};
