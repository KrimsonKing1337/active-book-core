import { useCallback, useEffect, useRef } from 'react';

import { useDispatch } from 'store';
import { backgroundEffectsActions } from 'store/effects/background';

import type { BackgroundEffect } from './@types';

import { effectsAreEqual } from './utils';

export const useBackground = (effect: BackgroundEffect) => {
  const dispatch = useDispatch();
  const registeredEffectRef = useRef<BackgroundEffect | null>(null);

  const destroy = useCallback(() => {
    const registeredEffect = registeredEffectRef.current;

    if (!registeredEffect) {
      return;
    }

    registeredEffectRef.current = null;
    dispatch(backgroundEffectsActions.deleteEffect(registeredEffect.id));
  }, [dispatch]);

  useEffect(() => {
    const registeredEffect = registeredEffectRef.current;

    if (registeredEffect?.id !== effect.id && registeredEffect) {
      dispatch(backgroundEffectsActions.deleteEffect(registeredEffect.id));
    }

    const isSameEffect = registeredEffect?.id === effect.id && effectsAreEqual(registeredEffect, effect);

    if (!isSameEffect) {
      registeredEffectRef.current = effect;
      dispatch(backgroundEffectsActions.setEffect(effect));
    }
  }, [effect, dispatch]);

  useEffect(() => {
    return destroy;
  }, [destroy]);

  return destroy;
};
