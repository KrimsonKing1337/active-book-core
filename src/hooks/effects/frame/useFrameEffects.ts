import { useCallback } from 'react';

import { useDispatch, useSelector } from '@store';

import { frameEffectsActions, frameEffectsSelectors } from '@store/effects/frame';

import type { FrameShadowItem, FrameTextItem } from './@types';

export const useFrameEffects = () => {
  const dispatch = useDispatch();

  const effects = useSelector(frameEffectsSelectors.effects);

  const updateShadow = useCallback((
    effectId: string,
    shadowId: string,
    changes: Partial<FrameShadowItem>,
  ) => {
    const update = {
      effectId,
      shadowId,
      changes,
    };

    dispatch(frameEffectsActions.updateShadow(update));
  }, [dispatch]);

  const updateText = useCallback((
    effectId: string,
    textId: string,
    changes: Partial<FrameTextItem>,
  ) => {
    const update = {
      effectId,
      textId,
      changes,
    };

    dispatch(frameEffectsActions.updateText(update));
  }, [dispatch]);

  return {
    effects,
    updateShadow,
    updateText,
  };
};
