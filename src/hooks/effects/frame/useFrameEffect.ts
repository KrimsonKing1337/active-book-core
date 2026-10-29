import { useEffect, useRef } from 'react';

import { useDispatch } from '@store';

import { frameEffectsActions } from '@store/effects/frame';

import type { FrameEffect } from './@types';

export const useFrameEffect = (effect: FrameEffect | null) => {
  const dispatch = useDispatch();

  const registeredEffectRef = useRef<FrameEffect | null>(null);
  const registeredOptionsKeyRef = useRef('');

  useEffect(() => {
    const registered = registeredEffectRef.current;

    if (!effect) {
      if (registered) {
        dispatch(frameEffectsActions.deleteEffect(registered.id));
      }

      registeredEffectRef.current = null;
      registeredOptionsKeyRef.current = '';

      return;
    }

    const {
      id,
      kind,
      layer,
      shadow,
      text,
      frameMask,
      style,
    } = effect;

    const options = {
      id,
      kind,
      layer,
      shadow,
      text,
      frameMask,
      style,
    };

    const optionsKey = JSON.stringify(options);

    if (registered && registered.id !== effect.id) {
      dispatch(frameEffectsActions.deleteEffect(registered.id));
    }

    const optionsChanged = registeredOptionsKeyRef.current !== optionsKey;
    const componentChanged = registered?.Component !== effect.Component;

    if (optionsChanged || componentChanged) {
      registeredEffectRef.current = effect;
      registeredOptionsKeyRef.current = optionsKey;

      dispatch(frameEffectsActions.setEffect(effect));
    }
  }, [dispatch, effect]);

  useEffect(() => {
    return () => {
      const registered = registeredEffectRef.current;

      if (registered) {
        registeredEffectRef.current = null;
        registeredOptionsKeyRef.current = '';

        dispatch(frameEffectsActions.deleteEffect(registered.id));
      }
    };
  }, [dispatch]);
};
