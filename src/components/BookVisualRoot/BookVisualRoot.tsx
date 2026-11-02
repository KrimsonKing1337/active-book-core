import type { HTMLAttributes, Ref } from 'react';

import { useCallback, useRef } from 'react';

import classNames from 'classnames';

import { type VisualEffects, VisualEffectsContext } from '@controllers/visualEffects';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import { VisualSurfaces } from '@components/VisualSurfaces';

import { useBookGeometry } from './geometry';
import { useVisualEffectSurfaces } from './hooks/useVisualEffectSurfaces';

import * as styles from './BookVisualRoot.module.scss';

export type BookVisualRootProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
  surfaces?: readonly VisualSurfaceItem[];
  inverseColors?: boolean;
  visualEffects?: VisualEffects;
  page?: number;
  hiddenVisualEffects?: readonly string[];
};

export const BookVisualRoot = ({
  children,
  className = '',
  ref,
  surfaces: suppliedSurfaces = [],
  visualEffects,
  page = 0,
  hiddenVisualEffects = [],
  inverseColors = false,
  ...etc
}: BookVisualRootProps) => {
  const bookRef = useRef<HTMLDivElement>(null);
  const shouldMeasure = suppliedSurfaces.length > 0 || !!visualEffects;

  const geometry = useBookGeometry(bookRef, shouldMeasure);

  const registeredSurfaces = useVisualEffectSurfaces({
    visualEffects,
    page,
    geometry,
    hiddenVisualEffects,
  });

  const surfaces = [...suppliedSurfaces, ...registeredSurfaces];

  const hasSurfaces = surfaces.length > 0;

  const ids = new Set<string>();

  for (const surfaceCur of surfaces) {
    if (ids.has(surfaceCur.id)) {
      throw new Error(`Duplicate visual surface ID in book: ${surfaceCur.id}`);
    }

    ids.add(surfaceCur.id);
  }

  const rootClassNames = classNames({
    [styles.BookVisualRoot]: true,
    [className]: !!className,
    [styles.inverseColors]: inverseColors,
  });

  const attachRoot = useCallback((element: HTMLDivElement | null) => {
    bookRef.current = element;

    if (typeof ref === 'function') {
      const cleanup = ref(element);

      if (cleanup) {
        return () => {
          bookRef.current = null;

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
      data-book-region="book"
    >
      {children}

      {hasSurfaces && (
        <VisualEffectsContext value={visualEffects ?? null}>
          <VisualSurfaces items={surfaces} geometry={geometry} />
        </VisualEffectsContext>
      )}
    </div>
  );
};
