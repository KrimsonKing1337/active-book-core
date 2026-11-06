import type { CSSProperties } from 'react';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import { getFrameMaskImage } from '@components/FrameEffects/utils';

import { localClipPath, localPlacementStyle } from '@components/VisualSurfaces/surfaceStyle';

import * as styles from './VisualSurface.module.scss';

type VisualSurfaceProps = {
  item: VisualSurfaceItem;
  zIndex: number;
};

export const VisualSurface = ({ item, zIndex }: VisualSurfaceProps) => {
  const frameSides = item.visibility?.sides;
  const frameWidth = item.visibility?.frameWidth;
  const widthStyle = frameWidth && 'value' in frameWidth
    ? { '--visual-frame-width': `${frameWidth.value}${frameWidth.unit}` }
    : {
      '--visual-frame-top': frameWidth?.top ? `${frameWidth.top.value}${frameWidth.top.unit}` : undefined,
      '--visual-frame-right': frameWidth?.right ? `${frameWidth.right.value}${frameWidth.right.unit}` : undefined,
      '--visual-frame-bottom': frameWidth?.bottom ? `${frameWidth.bottom.value}${frameWidth.bottom.unit}` : undefined,
      '--visual-frame-left': frameWidth?.left ? `${frameWidth.left.value}${frameWidth.left.unit}` : undefined,
    };
  const style = {
    ...widthStyle,
    zIndex,
    visibility: item.hidden ? 'hidden' as const : undefined,
    maskImage: frameSides ? getFrameMaskImage([...frameSides]) : undefined,
    maskComposite: frameSides ? 'add' : undefined,
    clipPath: localClipPath(item.visibility?.mask),
  } as CSSProperties;

  return (
    <div
      className={styles.Surface}
      style={style}
      data-visual-surface={item.id}
      data-surface-layout="local"
      data-visual-plane={item.depth.plane}
    >
      <div className={styles.Content} style={localPlacementStyle(item.placement)} data-visual-content={item.id}>
        {item.content}
      </div>
    </div>
  );
};
