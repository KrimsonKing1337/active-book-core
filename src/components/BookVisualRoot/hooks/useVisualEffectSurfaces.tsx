import { useLayoutEffect, useMemo, useSyncExternalStore } from 'react';

import type { VisualEffectRegistration } from '@active-book/types';

import { RegisteredVisualEffect } from '@components/RegisteredVisualEffect';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import type { VisualEffects } from '../../../visualEffects';
import { isVisualEffectActive } from '../../../visualEffects/lifetime';

import type { BookGeometry } from '../geometry';

type VisualEffectSurfacesOptions = {
  visualEffects?: VisualEffects;
  page: number;
  geometry: BookGeometry | null;
};

const emptySnapshot: readonly VisualEffectRegistration[] = [];
const readEmptySnapshot = () => emptySnapshot;
const subscribeEmpty = () => () => {};

export const useVisualEffectSurfaces = ({ visualEffects, page, geometry }: VisualEffectSurfacesOptions) => {
  const registrations = useSyncExternalStore(
    visualEffects?.subscribe ?? subscribeEmpty,
    visualEffects?.getSnapshot ?? readEmptySnapshot,
    visualEffects?.getSnapshot ?? readEmptySnapshot,
  );

  useLayoutEffect(() => visualEffects?.connectHost(), [visualEffects]);

  return useMemo<VisualSurfaceItem[]>(() => {
    if (!visualEffects) {
      return [];
    }

    const active = registrations.filter((registrationCur) => isVisualEffectActive(registrationCur.lifetime, page));

    return active.map(({ effect }) => {
      const generation = visualEffects.getGeneration(effect.id);
      const content = (
        <RegisteredVisualEffect
          key={generation}
          effect={effect}
          visualEffects={visualEffects}
          geometry={geometry}
        />
      );

      return {
        id: effect.id,
        placement: effect.placement,
        visibility: effect.visibility,
        depth: effect.depth,
        content,
      };
    });
  }, [registrations, page, geometry, visualEffects]);
};
