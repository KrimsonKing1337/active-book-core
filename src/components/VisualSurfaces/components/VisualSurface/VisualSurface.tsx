import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import { getFrameMaskImage } from '@components/FrameEffects/utils';

import { localClipPath, localPlacementStyle } from '@components/VisualSurfaces/surfaceStyle';

import * as styles from './VisualSurface.module.scss';

type VisualSurfaceProps = {
  item: VisualSurfaceItem;
  zIndex: number;
};

export const VisualSurface = ({ item, zIndex }: VisualSurfaceProps) => {
  const frameSides = item.visibility?.sides
    ?? (item.placement.region === 'frame' ? ['top', 'right', 'bottom', 'left'] as const : undefined);
  const style = {
    zIndex,
    visibility: item.hidden ? 'hidden' as const : undefined,
    maskImage: frameSides ? getFrameMaskImage([...frameSides]) : undefined,
    maskComposite: frameSides ? 'add' : undefined,
    clipPath: localClipPath(item.visibility?.mask),
  };

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
