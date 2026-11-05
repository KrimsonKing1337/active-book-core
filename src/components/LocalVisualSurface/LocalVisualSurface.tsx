import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import { getFrameMaskImage } from '@components/FrameEffects/utils';

import { localClipPath, localPlacementStyle } from '@components/LocalVisualSurfaces/surfaceStyle';

import * as styles from './LocalVisualSurface.module.scss';

type LocalVisualSurfaceProps = {
  item: VisualSurfaceItem;
  zIndex: number;
};

export const LocalVisualSurface = ({ item, zIndex }: LocalVisualSurfaceProps) => {
  const frameSides = item.visibility.region === 'frame' ? item.visibility.sides : null;
  const style = {
    zIndex,
    visibility: item.hidden ? 'hidden' as const : undefined,
    maskImage: frameSides ? getFrameMaskImage([...frameSides]) : undefined,
    maskComposite: frameSides ? 'add' : undefined,
    clipPath: localClipPath(item.visibility.mask),
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
