import { useCallback, useEffect, useRef } from 'react';

import type { FlashlightEffectOptions } from '@types';

import { useSelector } from 'store';
import { configSelectors } from 'store/config';
import { mainSelectors } from 'store/main';

import { useSideShadow } from 'hooks/effects/side/useSideShadow';

import { flashlightInst } from 'utils/effects/flashlight';

export const useFlashlight = (options: Partial<FlashlightEffectOptions> = {}) => {
  const currentPage = useSelector(mainSelectors.page);
  const flashlightEnabled = useSelector(configSelectors.flashlight);
  const theme = useSelector(configSelectors.theme);

  const {
    id,
    page,
    duration = 0,
    delay = 0,
    playOnLoad = false,
    withSideShadow = false,
    speed = 150,
  } = options;

  const color = theme === 'dark' ? '#fff' : '#9addf4';

  const { sideShadowOn, sideShadowOff } = useSideShadow({
    color,
    isActiveDefault: false,
    speed,
  });

  // useSideShadow currently returns new function instances on every render.
  // Keep the latest handlers without restarting a timed flashlight pulse.
  const sideShadowHandlersRef = useRef({ sideShadowOn, sideShadowOff });
  sideShadowHandlersRef.current = { sideShadowOn, sideShadowOff };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvePulseRef = useRef<(() => void) | null>(null);
  const runRef = useRef(0);

  const off = useCallback(() => {
    runRef.current += 1;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // An imperative caller may await the pulse (e.g. useRain).
    resolvePulseRef.current?.();
    resolvePulseRef.current = null;

    if (withSideShadow) {
      sideShadowHandlersRef.current.sideShadowOff();
    }

    flashlightInst.off();
  }, [withSideShadow]);

  const on = useCallback(async (pulseDuration?: number) => {
    // Invalidate pending camera initialization and any previous auto-off timer.
    off();

    if (document.hidden || (!flashlightEnabled && !withSideShadow)) {
      return;
    }

    const run = runRef.current;

    if (flashlightEnabled) {
      try {
        await flashlightInst.init();
      } catch (error) {
        console.error('Failed to initialize flashlight', error);
      }
    }

    // Leaving the page or turning the effect off during the permission prompt
    // must not turn the flashlight on after the async initialization finishes.
    if (run !== runRef.current || document.hidden) {
      return;
    }

    if (withSideShadow) {
      sideShadowHandlersRef.current.sideShadowOn();
    }

    if (flashlightEnabled) {
      flashlightInst.on();
    }

    if (pulseDuration && pulseDuration > 0) {
      await new Promise<void>((resolve) => {
        resolvePulseRef.current = resolve;
        timerRef.current = setTimeout(off, pulseDuration);
      });
    }
  }, [flashlightEnabled, withSideShadow, off]);

  // Preserve the original imperative hook's behavior on unmount.
  useEffect(() => {
    return () => {
      off();
    };
  }, [off]);

  useEffect(() => {
    if (!id || page !== currentPage || !playOnLoad || duration <= 0) {
      return;
    }

    // A visual sideShadow imitation is allowed even without a physical torch.
    if (!flashlightEnabled && !withSideShadow) {
      return;
    }

    const timer = setTimeout(() => {
      void on(duration);
    }, delay);

    return () => {
      clearTimeout(timer);
      off();
    };
  }, [
    currentPage,
    flashlightEnabled,
    id,
    page,
    duration,
    delay,
    playOnLoad,
    withSideShadow,
    on,
    off,
  ]);

  return {
    flashlightOff: off,
    flashlightOn: on,
  };
};
