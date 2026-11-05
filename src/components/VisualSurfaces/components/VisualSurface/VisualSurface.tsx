import type { CSSProperties } from 'react';

import classNames from 'classnames';

import type { StoryGeometry } from '@components/StoryRoot/geometry';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';
import { resolveVisualSurface } from '@components/VisualSurfaces/utils';
import { supportsCssLayout } from '@components/VisualSurfaces/utils/cssLayout';
import { getFrameMaskImage } from '@components/FrameEffects/utils';

import * as styles from './VisualSurface.module.scss';

export type VisualSurfaceProps = {
  item: VisualSurfaceItem;
  geometry: StoryGeometry | null;
  order: number;
};

export const VisualSurface = ({
  item,
  geometry,
  order,
}: VisualSurfaceProps) => {
  const supported = supportsCssLayout(item);
  const useCss = item.layout === 'css' || (item.layout === 'hybrid' && supported);
  const resolved = !useCss ? resolveVisualSurface({
    item,
    geometry,
  }) : null;

  const hasRegion = !!geometry?.regions[item.visibility.region];
  const available = useCss ? hasRegion : !!resolved;

  const visibility = available && !item.hidden ? 'visible' : 'hidden';
  const display = available ? undefined : 'none';

  const visibilityStyle: CSSProperties = {
    ...resolved?.visibilityStyle,
    zIndex: order,
    visibility,
    display,
  };

  if (useCss && item.visibility.region === 'frame') {
    visibilityStyle.maskImage = getFrameMaskImage([...item.visibility.sides]);
    visibilityStyle.maskComposite = 'add';
  }

  const clipFrame = item.visibility.region === 'frame' || item.visibility.region === 'narrativeFrame';
  const placeFrame = item.placement.coordinates === 'narrativeFrame';
  const layoutClasses = classNames(styles.Layout, {
    [styles.Css]: useCss,
    [styles.ClipFrame]: clipFrame,
    [styles.PlaceFrame]: placeFrame,
  });

  return (
    <div className={layoutClasses} data-surface-layout={useCss ? 'css' : 'geometry'} data-css-supported={supported}>
      <div className={styles.LayoutViewport}>
        <div className={styles.LayoutFrame}>
          <div className={styles.Visibility} style={visibilityStyle} data-visual-surface={item.id}>
            <div className={styles.Surface} style={resolved?.surfaceStyle} data-visual-content={item.id}>
              {item.content}
            </div>
          </div>
        </div>

        <div className={styles.ToolbarSpace} />
      </div>
    </div>
  );
};
