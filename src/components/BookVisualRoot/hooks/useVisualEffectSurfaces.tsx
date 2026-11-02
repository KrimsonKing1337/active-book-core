import { useLayoutEffect, useMemo, useSyncExternalStore } from 'react';

import type { VisualEffectRegistration } from '@active-book/types';

import { isVisualEffectActive, type VisualEffects } from '@controllers/visualEffects';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';
import { RegisteredVisualEffect } from '@components/RegisteredVisualEffect';

import type { BookGeometry } from '../geometry';

export type VisualEffectSurfacesOptions = {
  visualEffects?: VisualEffects;
  page: number;
  hiddenVisualEffects: readonly string[];
  geometry: BookGeometry | null;
};

const emptySnapshot: readonly VisualEffectRegistration[] = [];

const readEmptySnapshot = () => emptySnapshot;
const readNoPages = () => 0;
const subscribeEmpty = () => () => {};

export const useVisualEffectSurfaces = ({
  visualEffects,
  page,
  geometry,
  hiddenVisualEffects,
}: VisualEffectSurfacesOptions) => {
  const visualEffectsSubscribe = visualEffects?.subscribe ?? subscribeEmpty;
  const visualEffectsSnapshot = visualEffects?.getSnapshot ?? readEmptySnapshot;
  const visualEffectsPageCount = visualEffects?.getPageCount ?? readNoPages;

  const registrations = useSyncExternalStore(
    visualEffectsSubscribe,
    visualEffectsSnapshot,
    visualEffectsSnapshot,
  );

  const pages = useSyncExternalStore(
    visualEffectsSubscribe,
    visualEffectsPageCount,
    visualEffectsPageCount,
  );

  useLayoutEffect(() => {
    return visualEffects?.connectHost();
  }, [visualEffects]);

  return useMemo<VisualSurfaceItem[]>(() => {
    if (!visualEffects || page < 1 || page > pages) {
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
          definition={definition}
          visualEffects={visualEffects}
          geometry={geometry}
        />
      );

      const isHidden = hiddenVisualEffects.includes(id);

      return {
        id: id,
        placement: placement,
        visibility: visibility,
        depth,
        content,
        hidden: isHidden,
      };
    });
  }, [registrations, page, pages, geometry, visualEffects, hiddenVisualEffects]);
};
