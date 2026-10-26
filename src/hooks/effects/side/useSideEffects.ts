import { useCallback } from 'react';

import { useDispatch, useSelector } from 'store';

import { sideEffectsActions, sideEffectsSelectors } from 'store/effects/side';

import type { SideShadowItem, SideTextItem } from './@types';

export const useSideEffects = () => {
  const dispatch = useDispatch();

  const effects = useSelector(sideEffectsSelectors.effects);

  const updateShadow = useCallback((
    effectId: string,
    shadowId: string,
    changes: Partial<SideShadowItem>,
  ) => {
    const update = {
      effectId,
      shadowId,
      changes,
    };

    dispatch(sideEffectsActions.updateShadow(update));
  }, [dispatch]);

  const updateText = useCallback((
    effectId: string,
    textId: string,
    changes: Partial<SideTextItem>,
  ) => {
    const update = {
      effectId,
      textId,
      changes,
    };

    dispatch(sideEffectsActions.updateText(update));
  }, [dispatch]);

  return {
    effects,
    updateShadow,
    updateText,
  };
};
