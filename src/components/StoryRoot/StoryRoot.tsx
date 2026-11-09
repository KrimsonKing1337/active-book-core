import { type CSSProperties, type HTMLAttributes, type Ref, useCallback, useLayoutEffect } from 'react';

import classNames from 'classnames';

import { type VisualEffects, VisualEffectsContext } from '@controllers/visualEffects';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import { useStoryRegions } from '@components/StoryRegionsProvider';
import { VisualHost } from '@components/VisualHost';

import { VisualSurfaces } from '@components/VisualSurfaces';
import { VisualSelectionOutline } from '@components/VisualSelectionOutline';
import { useAppMode } from '@components/App/AppModeContext';
import { useBookApplicationSurface } from '@components/BookApplicationSurface/context';

import { useVisualEffectSurfaces } from './hooks/useVisualEffectSurfaces';

import * as styles from './StoryRoot.module.scss';

export type StoryRootProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
  surfaces?: readonly VisualSurfaceItem[];
  inverseColors?: boolean;
  visualEffects?: VisualEffects;
  page?: number;
  hiddenVisualEffects?: readonly string[];
  selectedVisualEffectId?: string | null;
};

export const StoryRoot = ({
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
}: StoryRootProps) => {
  const appMode = useAppMode();
  const application = useBookApplicationSurface();
  const { refs } = useStoryRegions();

  const setApplicationInverse = application?.setInverseColors;

  useLayoutEffect(() => {
    setApplicationInverse?.(inverseColors);

    return () => {
      return setApplicationInverse?.(false);
    };
  }, [inverseColors, setApplicationInverse]);
  const registeredSurfaces = useVisualEffectSurfaces({
    visualEffects,
    page,
    hiddenVisualEffects,
  });

  const surfaces = [...suppliedSurfaces, ...registeredSurfaces];

  const hasSurfaces = surfaces.length > 0;

  let selectedSurface;

  if (appMode === 'editor') {
    selectedSurface = surfaces.find((surfaceCur) => {
      return surfaceCur.id === selectedVisualEffectId;
    });
  }

  const ids = new Set<string>();

  for (const surfaceCur of surfaces) {
    if (ids.has(surfaceCur.id)) {
      throw new Error(`Duplicate visual surface ID in story: ${surfaceCur.id}`);
    }

    ids.add(surfaceCur.id);
  }

  const rootClassNames = classNames({
    [styles.StoryRoot]: true,
    [className]: !!className,
    [styles.inverseColors]: inverseColors && !application,
  });

  const attachRoot = useCallback((element: HTMLDivElement | null) => {
    refs.story(element);

    if (typeof ref === 'function') {
      const cleanup = ref(element);

      if (cleanup) {
        return () => {
          cleanup();
        };
      }
    } else if (ref) {
      ref.current = element;
    }
  }, [ref, refs]);

  const layerStep = surfaces.length + 1;

  const rootStyle = {
    ...etc.style,
    '--visual-layer-step': layerStep,
  } as CSSProperties;

  return (
    <div
      {...etc}
      ref={attachRoot}
      className={rootClassNames}
      style={rootStyle}
      data-story-region="story"
    >
      {children}
      <VisualHost region="story" />

      {hasSurfaces && (
        <VisualEffectsContext value={visualEffects ?? null}>
          <VisualSurfaces items={surfaces} stride={layerStep} />
        </VisualEffectsContext>
      )}

      {appMode === 'editor' && (
        <VisualSelectionOutline item={selectedSurface} />
      )}
    </div>
  );
};
