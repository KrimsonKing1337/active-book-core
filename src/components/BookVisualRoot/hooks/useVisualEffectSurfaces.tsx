import { useLayoutEffect, useMemo, useSyncExternalStore } from 'react';

import type { VisualEffectRegistration } from '@active-book/types';

import { isVisualEffectActive, type VisualEffects } from '@controllers/visualEffects';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';
import { RegisteredVisualEffect } from '@components/RegisteredVisualEffect';

import type { BookGeometry } from '../geometry';

export type VisualEffectSurfacesOptions = {
  visualEffects?: VisualEffects;
  page: number;
  geometry: BookGeometry | null;
};

const emptySnapshot: readonly VisualEffectRegistration[] = [];

const readEmptySnapshot = () => emptySnapshot;
const subscribeEmpty = () => () => {};

export const useVisualEffectSurfaces = ({
  visualEffects,
  page,
  geometry,
}: VisualEffectSurfacesOptions) => {
  const visualEffectsSubscribe = visualEffects?.subscribe ?? subscribeEmpty;
  const visualEffectsSnapshot = visualEffects?.getSnapshot ?? readEmptySnapshot;

  const registrations = useSyncExternalStore(
    visualEffectsSubscribe,
    visualEffectsSnapshot,
    visualEffectsSnapshot,
  );

  useLayoutEffect(() => {
    return visualEffects?.connectHost();
  }, [visualEffects]);

  return useMemo<VisualSurfaceItem[]>(() => {
    if (!visualEffects) {
      return [];
    }

    const active = registrations.filter((registrationCur) => {
      return isVisualEffectActive(registrationCur.lifetime, page);
    });

    return active.map(({ effect }) => {
      const { definitionId, visibility, depth: effectDepth, id, placement } = effect;

      const generation = visualEffects.getGeneration(id);
      const definition = visualEffects.getDefinition(definitionId);

      let depth: VisualSurfaceItem['depth'] = effectDepth;

      if (definition.systemFeedback) {
        depth = {
          plane: 'systemFeedback',
          order: effectDepth.order,
        };
      }

      const content = (
        <RegisteredVisualEffect
          key={generation}
          effect={effect}
          visualEffects={visualEffects}
          geometry={geometry}
        />
      );

      return {
        id: id,
        placement: placement,
        visibility: visibility,
        depth,
        content,
      };
    });
  }, [registrations, page, geometry, visualEffects]);
};
