import type { SideAnimation, SideEffect, SideShadowItem } from '@hooks/effects/side/@types';

import { useCallback, useId, useRef } from 'react';

import { useDispatch } from '@store';

import { sideEffectsActions } from '@store/effects/side';

import { useAppMode } from '@components/App/AppModeContext';

import { useSideEffect } from '@hooks/effects/side/useSideEffect';

const MIN_VISIBLE_DURATION = 200;

export const useVibrationPreview = () => {
  const dispatch = useDispatch();

  const appMode = useAppMode();

  const generatedId = useId();
  const effectId = `vibration-preview-${generatedId}`;
  const shadowId = 'feedback';

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shadowAnimation: SideAnimation = {
    preset: 'pulse',
    duration: 160,
  };

  const shadow: SideShadowItem = {
    id: shadowId,
    hidden: true,
    thickness: 35,
    style: { color: '#bb89ff' },
    animation: shadowAnimation,
  };

  let effect: SideEffect | null = null;

  if (appMode === 'editor') {
    effect = {
      id: effectId,
      kind: 'shadow',
      shadow,
    };
  }

  useSideEffect(effect);

  const setHidden = useCallback((hidden: boolean) => {
    dispatch(sideEffectsActions.updateShadow({
      effectId,
      shadowId,
      changes: { hidden },
    }));
  }, [dispatch, effectId]);

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

    const delay = Math.max(duration, MIN_VISIBLE_DURATION);

    timerRef.current = setTimeout(() => {
      timerRef.current = null;

      setHidden(true);
    }, delay);
  }, [appMode, setHidden]);

  return {
    start,
    stop,
  };
};
