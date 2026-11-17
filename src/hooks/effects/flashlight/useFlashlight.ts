import {
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';

import type { FlashlightEffectOptions } from '@types';

import { useSelector } from '@store';

import { configSelectors } from '@store/config';
import { mainSelectors } from '@store/main';

import type {
  FrameAnimation,
  FrameEffect,
  FrameShadowItem,
} from '@hooks/effects/frame/@types';

import { useFrameEffect } from '@hooks/effects/frame/useFrameEffect';
import { useFrameEffects } from '@hooks/effects/frame/useFrameEffects';

import { flashlightInst } from '@utils/effects/flashlight';

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
    withFrameShadow = false,
    speed = 150,
  } = options;

  const color = theme === 'dark' ? '#fff' : '#9addf4';

  const generatedId = useId();
  const shadowEffectId = `flashlight-frame-${generatedId}`;
  const shadowId = 'glow';

  const shadowStyle = {
    color,
  };

  const shadowAnimation: FrameAnimation = {
    preset: 'pulse',
    duration: speed,
  };

  const shadow: FrameShadowItem = {
    id: shadowId,
    sides: ['left', 'right'],
    style: shadowStyle,
    hidden: true,
    animation: shadowAnimation,
  };

  let shadowEffect: FrameEffect | null = null;

  if (withFrameShadow) {
    shadowEffect = {
      id: shadowEffectId,
      kind: 'shadow',
      layer: 'overlay',
      shadow,
    };
  }

  useFrameEffect(shadowEffect);

  const { updateShadow } = useFrameEffects();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvePulseRef = useRef<(() => void) | null>(null);
  const runRef = useRef(0);

  const off = useCallback(() => {
    runRef.current += 1;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);

      timerRef.current = null;
    }

    // An imperative caller may await the pulse.
    resolvePulseRef.current?.();
    resolvePulseRef.current = null;

    if (withFrameShadow) {
      updateShadow(shadowEffectId, shadowId, { hidden: true });
    }

    flashlightInst.off();
  }, [
    withFrameShadow,
    updateShadow,
    shadowEffectId,
  ]);

  const on = useCallback(async (pulseDuration?: number) => {
    // Invalidate pending camera initialization and any previous auto-off timer.
    off();

    if (document.hidden || (!flashlightEnabled && !withFrameShadow)) {
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

    if (withFrameShadow) {
      updateShadow(shadowEffectId, shadowId, { hidden: false });
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
  }, [
    flashlightEnabled,
    withFrameShadow,
    off,
    updateShadow,
    shadowEffectId,
  ]);

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

    // A visual frameShadow imitation is allowed even without a physical torch.
    if (!flashlightEnabled && !withFrameShadow) {
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
    withFrameShadow,
    on,
    off,
  ]);

  return {
    flashlightOff: off,
    flashlightOn: on,
  };
};
