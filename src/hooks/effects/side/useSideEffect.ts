import { useEffect, useRef } from 'react';

import { useDispatch } from 'store';
import { sideEffectsActions } from 'store/effects/side/effects';

import type { SideEffect } from './@types';

export const useSideEffect = (effect: SideEffect) => {
  const dispatch = useDispatch();
  const registeredEffectRef = useRef<SideEffect | null>(null);
  const registeredOptionsKeyRef = useRef('');

  useEffect(() => {
    const registered = registeredEffectRef.current;
    const optionsKey = JSON.stringify({
      id: effect.id,
      shadows: effect.shadows,
      texts: effect.texts,
    });

    if (registered && registered.id !== effect.id) {
      dispatch(sideEffectsActions.deleteEffect(registered.id));
    }

    const optionsChanged = registeredOptionsKeyRef.current !== optionsKey;
    const componentChanged = registered?.Component !== effect.Component;

    if (optionsChanged || componentChanged) {
      registeredEffectRef.current = effect;
      registeredOptionsKeyRef.current = optionsKey;
      dispatch(sideEffectsActions.setEffect(effect));
    }
  }, [dispatch, effect]);

  useEffect(() => {
    return () => {
      const registered = registeredEffectRef.current;

      if (registered) {
        registeredEffectRef.current = null;
        registeredOptionsKeyRef.current = '';
        dispatch(sideEffectsActions.deleteEffect(registered.id));
      }
    };
  }, [dispatch]);
};
