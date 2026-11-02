import {
  useCallback, useContext, useMemo, useSyncExternalStore,
} from 'react';

import type { JsonObject, VisualEffectRegistration } from '@active-book/types';

import { VisualEffectsContext } from '@@/controllers/visualEffects/context';
import { FEEDBACK_DEFINITION, FRAME_DEFINITION } from '@@/controllers/visualEffects/definitions';
import { createBuiltinRegistration } from '@@/controllers/visualEffects/declarations';

import type { FrameEffect, FrameShadowItem, FrameTextItem } from './@types';

const emptySnapshot: readonly VisualEffectRegistration[] = [];
const getEmptySnapshot = () => emptySnapshot;
const subscribeEmpty = () => () => {};

export const useFrameEffects = () => {
  const session = useContext(VisualEffectsContext);
  const registrations = useSyncExternalStore(
    session?.subscribe ?? subscribeEmpty,
    session?.getSnapshot ?? getEmptySnapshot,
    session?.getSnapshot ?? getEmptySnapshot,
  );
  const effects = useMemo(() => {
    const result: Record<string, FrameEffect> = {};
    for (const registrationCur of registrations) {
      const { id, definitionId, params } = registrationCur.effect;
      if (definitionId === FRAME_DEFINITION || definitionId === FEEDBACK_DEFINITION) {
        // The built-in definition stores the typed frame options as JSON.
        result[id] = {
          ...params,
          id,
        } as FrameEffect;
      }
    }

    return result;
  }, [registrations]);

  const updateItem = useCallback((update: {
    effectId: string;
    itemId: string;
    kind: 'shadow' | 'text';
    changes: Partial<FrameShadowItem> | Partial<FrameTextItem>;
  }) => {
    const {
      effectId, itemId, kind, changes,
    } = update;
    if (!session) {
      return;
    }
    const registration = session.getSnapshot().find((cur) => cur.effect.id === effectId);
    if (
      !registration
      || (registration.effect.definitionId !== FRAME_DEFINITION
        && registration.effect.definitionId !== FEEDBACK_DEFINITION)
    ) {
      return;
    }
    const options = registration.effect.params as JsonObject & Omit<FrameEffect, 'id' | 'Component'>;
    const previous = options[kind];
    if (!previous || previous.id !== itemId) {
      return;
    }
    const next = {
      ...previous,
      ...changes,
    };
    if (changes.style) {
      next.style = {
        ...previous.style,
        ...changes.style,
      };
    }
    if (changes.animation) {
      next.animation = {
        ...previous.animation,
        ...changes.animation,
      };
    }
    const params = JSON.parse(JSON.stringify({
      ...options,
      [kind]: next,
    }));
    const effect = {
      params,
      depth: registration.effect.depth,
    };
    const orderChanged = 'style' in changes && (!changes.style || 'zIndex' in changes.style);
    if (orderChanged) {
      const updated = createBuiltinRegistration({
        type: 'frame',
        options: {
          ...params,
          id: effectId,
        },
        lifetime: registration.lifetime,
      });
      effect.depth = {
        ...effect.depth,
        order: updated.effect.depth.order,
      };
    }
    session.update(effectId, { effect });
  }, [session]);

  const updateShadow = useCallback((effectId: string, shadowId: string, changes: Partial<FrameShadowItem>) => {
    updateItem({
      effectId,
      itemId: shadowId,
      kind: 'shadow',
      changes,
    });
  }, [updateItem]);

  const updateText = useCallback((effectId: string, textId: string, changes: Partial<FrameTextItem>) => {
    updateItem({
      effectId,
      itemId: textId,
      kind: 'text',
      changes,
    });
  }, [updateItem]);

  return {
    effects,
    updateShadow,
    updateText,
  };
};
