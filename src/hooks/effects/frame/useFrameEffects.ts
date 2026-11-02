import {
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';

import type { JsonObject, VisualEffectRegistration } from '@active-book/types';

import {
  FEEDBACK_DEFINITION,
  FRAME_DEFINITION,
  VisualEffectsContext,
  createBuiltinRegistration,
} from '@controllers/visualEffects';

import type { FrameEffect, FrameShadowItem, FrameTextItem } from './@types';

const emptySnapshot: readonly VisualEffectRegistration[] = [];

const getEmptySnapshot = () => emptySnapshot;
const subscribeEmpty = () => () => {};

export const useFrameEffects = () => {
  const session = useContext(VisualEffectsContext);

  const subscribe = session?.subscribe ?? subscribeEmpty;
  const snapshot = session?.getSnapshot ?? getEmptySnapshot;

  const registrations = useSyncExternalStore(
    subscribe,
    snapshot,
    snapshot,
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

  type Update = {
    effectId: string;
    itemId: string;
    kind: 'shadow' | 'text';
    changes: Partial<FrameShadowItem> | Partial<FrameTextItem>;
  };

  const updateItem = useCallback(({
    changes,
    effectId,
    itemId,
    kind,
  }: Update) => {
    if (!session) {
      return;
    }

    const registration = session.getSnapshot().find((itemCur) => {
      return itemCur.effect.id === effectId;
    });

    if (!registration) {
      return;
    }

    const { definitionId } = registration.effect;

    const isFrameDefinition = definitionId === FRAME_DEFINITION;
    const isFeedbackDefinition = definitionId === FEEDBACK_DEFINITION;

    const isSupportedDefinition = isFrameDefinition || isFeedbackDefinition;

    if (!isSupportedDefinition) {
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

    const hasStyleChanges = 'style' in changes;
    const isStyleRemoved = !changes.style;
    const hasZIndexChanges = changes.style ? 'zIndex' in changes.style : false;

    const orderChanged = hasStyleChanges && (isStyleRemoved || hasZIndexChanges);

    if (orderChanged) {
      const options = {
        ...params,
        id: effectId,
      };

      const updated = createBuiltinRegistration({
        type: 'frame',
        options,
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
