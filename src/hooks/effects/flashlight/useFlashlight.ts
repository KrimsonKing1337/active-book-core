import { useCallback, useEffect, useRef } from 'react';

import type { FlashlightEffectOptions } from '@types';

import { useSelector } from 'store';
import { configSelectors } from 'store/config';
import { mainSelectors } from 'store/main';

import { useSideShadow } from 'hooks/effects/side/useSideShadow';

import { flashlightInst } from 'utils/effects/flashlight';

// The boolean overload is kept for the existing imperative useFlashlight(withSideShadow, speed) API.
export const useFlashlight = (optionsOrSideShadow: FlashlightEffectOptions | boolean = false, speed = 150) => {
  const currentPage = useSelector(mainSelectors.page);
  const flashlightEnabled = useSelector(configSelectors.flashlight);
  const theme = useSelector(configSelectors.theme);

  const options = typeof optionsOrSideShadow === 'boolean' ? undefined : optionsOrSideShadow;
  const sideShadow = typeof optionsOrSideShadow === 'boolean'
    ? optionsOrSideShadow
    : options?.sideShadow ?? false;
  const shadowSpeed = options ? 150 : speed;

  const id = options?.id;
  const page = options?.page;
  const duration = options?.duration ?? 0;
  const delay = options?.delay ?? 0;
  const playOnLoad = options?.playOnLoad ?? false;

  const color = theme === 'dark' ? '#fff' : '#9addf4';

  const { sideShadowOn, sideShadowOff } = useSideShadow({
    color,
    isActiveDefault: false,
    speed: shadowSpeed,
  });

  // useSideShadow currently returns new function instances on every render.
  // Keep the latest handlers without restarting a timed flashlight pulse.
  const sideShadowHandlersRef = useRef({ sideShadowOn, sideShadowOff });
  sideShadowHandlersRef.current = { sideShadowOn, sideShadowOff };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runRef = useRef(0);

  const off = useCallback(() => {
    runRef.current += 1;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (sideShadow) {
      sideShadowHandlersRef.current.sideShadowOff();
    }

    flashlightInst.off();
  }, [sideShadow]);

  const on = useCallback(async (pulseDuration?: number) => {
    // Invalidate pending camera initialization and any previous auto-off timer.
    off();

    if (document.hidden || (!flashlightEnabled && !sideShadow)) {
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

    if (sideShadow) {
      sideShadowHandlersRef.current.sideShadowOn();
    }

    if (flashlightEnabled) {
      flashlightInst.on();
    }

    if (pulseDuration && pulseDuration > 0) {
      timerRef.current = setTimeout(off, pulseDuration);
    }
  }, [flashlightEnabled, sideShadow, off]);

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
    if (!flashlightEnabled && !sideShadow) {
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
    sideShadow,
    on,
    off,
  ]);

  return {
    flashlightOff: off,
    flashlightOn: on,
  };
};
