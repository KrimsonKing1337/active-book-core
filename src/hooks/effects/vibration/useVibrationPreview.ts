import {
  useCallback,
  useId,
  useRef,
} from 'react';

import type { FrameEffect, FrameShadowItem } from '@hooks/effects/frame/@types';
import { useFrameEffect, useFrameEffects } from '@hooks/effects/frame';

import { useAppMode } from '@components/App/AppModeContext';

const MIN_PREVIEW_DURATION = 15;

export const useVibrationPreview = () => {
  const { updateShadow } = useFrameEffects();

  const appMode = useAppMode();

  const generatedId = useId();
  const effectId = `vibration-preview-${generatedId}`;
  const shadowId = 'feedback';

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shadow: FrameShadowItem = {
    id: shadowId,
    hidden: true,
    sides: ['left', 'right'],
    thickness: 35,
    style: { color: '#bb89ff' },
  };

  let effect: FrameEffect | null = null;

  if (appMode === 'editor') {
    effect = {
      id: effectId,
      kind: 'shadow',
      layer: 'overlay',
      shadow,
    };
  }

  useFrameEffect(effect);

  const setHidden = useCallback((hidden: boolean) => {
    updateShadow(effectId, shadowId, { hidden });
  }, [updateShadow, effectId]);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);

      timerRef.current = null;
    }

    if (appMode === 'editor') {
      setHidden(true);
    }
  }, [appMode, setHidden]);

  const start = useCallback((duration: number) => {
    if (appMode !== 'editor' || !Number.isFinite(duration) || duration <= 0) {
      return;
    }

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    setHidden(false);

    const previewDuration = Math.max(duration, MIN_PREVIEW_DURATION);

    timerRef.current = setTimeout(() => {
      timerRef.current = null;

      setHidden(true);
    }, previewDuration);
  }, [appMode, setHidden]);

  return {
    start,
    stop,
  };
};
