import type { HTMLAttributes, Ref } from 'react';

import { useCallback, useRef } from 'react';

import classNames from 'classnames';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import { VisualSurfaces } from '@components/VisualSurfaces';

import { useBookGeometry } from './geometry';

import * as styles from './BookVisualRoot.module.scss';

export type BookVisualRootProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
  surfaces?: readonly VisualSurfaceItem[];
  inverseColors?: boolean;
};

export const BookVisualRoot = ({
  children,
  className,
  ref,
  surfaces = [],
  inverseColors = false,
  ...etc
}: BookVisualRootProps) => {
  const bookRef = useRef<HTMLDivElement>(null);
  const hasSurfaces = surfaces.length > 0;
  const geometry = useBookGeometry(bookRef, hasSurfaces);
  const rootClassNames = classNames(styles.BookVisualRoot, className, {
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
        <VisualSurfaces items={surfaces} geometry={geometry} />
      )}
    </div>
  );
};
