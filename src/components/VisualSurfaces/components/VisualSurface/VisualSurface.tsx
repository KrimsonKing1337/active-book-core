import type { CSSProperties } from 'react';

import type { BookGeometry } from '@components/BookVisualRoot/geometry';

import type { VisualSurfaceItem } from '../../@types';

import { resolveVisualSurface } from '../../utils/resolveVisualSurface';

import * as styles from './VisualSurface.module.scss';

type VisualSurfaceProps = {
  item: VisualSurfaceItem;
  geometry: BookGeometry | null;
  order: number;
};

export const VisualSurface = ({ item, geometry, order }: VisualSurfaceProps) => {
  const resolved = resolveVisualSurface({ item, geometry });

  const visibilityStyle: CSSProperties = {
    ...resolved?.visibilityStyle,
    zIndex: order,
    visibility: resolved ? 'visible' : 'hidden',
    display: resolved ? undefined : 'none',
  };

  return (
    <div className={styles.Visibility} style={visibilityStyle} data-visual-surface={item.id}>
      <div className={styles.Surface} style={resolved?.surfaceStyle} data-visual-content={item.id}>
        {item.content}
      </div>
    </div>
  );
};
