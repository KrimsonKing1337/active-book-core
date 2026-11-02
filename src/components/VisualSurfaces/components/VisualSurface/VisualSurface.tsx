import type { CSSProperties } from 'react';

import type { BookGeometry } from '@components/BookVisualRoot/geometry';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';
import { resolveVisualSurface } from '@components/VisualSurfaces/utils';

import * as styles from './VisualSurface.module.scss';

export type VisualSurfaceProps = {
  item: VisualSurfaceItem;
  geometry: BookGeometry | null;
  order: number;
};

export const VisualSurface = ({ item, geometry, order }: VisualSurfaceProps) => {
  const resolved = resolveVisualSurface({ item, geometry });

  const visibility = resolved && !item.hidden ? 'visible' : 'hidden';
  const display = resolved ? undefined : 'none';

  const visibilityStyle: CSSProperties = {
    ...resolved?.visibilityStyle,
    zIndex: order,
    visibility,
    display,
  };

  return (
    <div className={styles.Visibility} style={visibilityStyle} data-visual-surface={item.id}>
      <div className={styles.Surface} style={resolved?.surfaceStyle} data-visual-content={item.id}>
        {item.content}
      </div>
    </div>
  );
};
