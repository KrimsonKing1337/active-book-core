import { type HTMLAttributes, type Ref, useCallback, useRef } from 'react';

import classNames from 'classnames';

import { type VisualEffects, VisualEffectsContext } from '@controllers/visualEffects';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import { VisualSurfaces } from '@components/VisualSurfaces';
import { VisualSelectionOutline } from '@components/VisualSelectionOutline';
import { useAppMode } from '@components/App/AppModeContext';

import { useStoryGeometry } from './geometry';
import { useVisualEffectSurfaces } from './hooks/useVisualEffectSurfaces';

import * as styles from './StoryVisualRoot.module.scss';

export type StoryVisualRootProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
  surfaces?: readonly VisualSurfaceItem[];
  inverseColors?: boolean;
  visualEffects?: VisualEffects;
  page?: number;
  hiddenVisualEffects?: readonly string[];
  selectedVisualEffectId?: string | null;
};

export const StoryVisualRoot = ({
  children,
  className = '',
  ref,
  surfaces: suppliedSurfaces = [],
  visualEffects,
  page = 0,
  hiddenVisualEffects = [],
  inverseColors = false,
  selectedVisualEffectId,
  ...etc
}: StoryVisualRootProps) => {
  const storyRef = useRef<HTMLDivElement>(null);
  const appMode = useAppMode();
  const shouldMeasure = suppliedSurfaces.length > 0 || !!visualEffects;

  const geometry = useStoryGeometry(storyRef, shouldMeasure);

  const registeredSurfaces = useVisualEffectSurfaces({
    visualEffects,
    page,
    geometry,
    hiddenVisualEffects,
  });

  const surfaces = [...suppliedSurfaces, ...registeredSurfaces];

  const hasSurfaces = surfaces.length > 0;
  const selectedSurface = appMode === 'editor'
    ? surfaces.find((cur) => cur.id === selectedVisualEffectId)
    : undefined;

  const ids = new Set<string>();

  for (const surfaceCur of surfaces) {
    if (ids.has(surfaceCur.id)) {
      throw new Error(`Duplicate visual surface ID in story: ${surfaceCur.id}`);
    }

    ids.add(surfaceCur.id);
  }

  const rootClassNames = classNames({
    [styles.StoryVisualRoot]: true,
    [className]: !!className,
    [styles.inverseColors]: inverseColors,
  });

  const attachRoot = useCallback((element: HTMLDivElement | null) => {
    storyRef.current = element;

    if (typeof ref === 'function') {
      const cleanup = ref(element);

      if (cleanup) {
        return () => {
          storyRef.current = null;

          cleanup();
        };
      }
    } else if (ref) {
      ref.current = element;
    }
  }, [ref]);

  return (
    <div
      {...etc}
      ref={attachRoot}
      className={rootClassNames}
      data-story-region="story"
    >
      {children}

      {hasSurfaces && (
        <VisualEffectsContext value={visualEffects ?? null}>
          <VisualSurfaces items={surfaces} geometry={geometry} />
        </VisualEffectsContext>
      )}

      <VisualSelectionOutline item={selectedSurface} geometry={geometry} />
    </div>
  );
};
