import { useCallback } from 'react';

import { useDispatch, useSelector } from 'store';
import { sideEffectsActions, sideEffectsSelectors } from 'store/effects/side/effects';

import type { SideShadowItem, SideTextItem } from './@types';

export const useSideEffects = () => {
  const dispatch = useDispatch();
  const effects = useSelector(sideEffectsSelectors.effects);

  const updateShadow = useCallback((
    effectId: string,
    shadowId: string,
    changes: Partial<SideShadowItem>,
  ) => {
    dispatch(sideEffectsActions.updateShadow({ effectId, shadowId, changes }));
  }, [dispatch]);

  const updateText = useCallback((
    effectId: string,
    textId: string,
    changes: Partial<SideTextItem>,
  ) => {
    dispatch(sideEffectsActions.updateText({ effectId, textId, changes }));
  }, [dispatch]);

  return { effects, updateShadow, updateText };
};
