import {
  type CSSProperties,
  Suspense,
  useLayoutEffect,
  useState,
} from 'react';

import { usePagePresented } from '@hooks/pagePresentation/context';
import { usePageResource } from '@hooks/pagePresentation/usePageResource';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import { getFrameMaskImage } from '@components/FrameEffects/utils';

import { localClipPath, localPlacementStyle } from '@components/VisualSurfaces/surfaceStyle';

import * as styles from './VisualSurface.module.scss';

type VisualSurfaceProps = {
  item: VisualSurfaceItem;
  zIndex: number;
};

const holdForVisualContent = () => {};

const PendingVisualContent = () => {
  usePageResource(holdForVisualContent);

  return null;
};

export const VisualSurface = ({ item, zIndex }: VisualSurfaceProps) => {
  const presented = usePagePresented();

  const [started, setStarted] = useState(false);

  useLayoutEffect(() => {
    if (presented) {
      setStarted(true);
    }
  }, [presented]);

  const preparing = !presented && !started;
  const frameSides = item.visibility?.sides;
  const frameWidth = item.visibility?.frameWidth;

  type FrameStyle = CSSProperties & {
    [key: `--visual-frame-${string}`]: string | undefined;
  };

  const style: FrameStyle = {
    zIndex,
  };

  if (frameWidth && 'value' in frameWidth) {
    style['--visual-frame-width'] = `${frameWidth.value}${frameWidth.unit}`;
  } else if (frameWidth) {
    const {
      top,
      right,
      bottom,
      left,
    } = frameWidth;

    if (top) {
      style['--visual-frame-top'] = `${top.value}${top.unit}`;
    }

    if (right) {
      style['--visual-frame-right'] = `${right.value}${right.unit}`;
    }

    if (bottom) {
      style['--visual-frame-bottom'] = `${bottom.value}${bottom.unit}`;
    }

    if (left) {
      style['--visual-frame-left'] = `${left.value}${left.unit}`;
    }
  }

  if (item.hidden || preparing) {
    style.visibility = 'hidden';
  }

  if (frameSides) {
    style.maskImage = getFrameMaskImage([...frameSides]);
    style.maskComposite = 'add';
  }

  style.clipPath = localClipPath(item.visibility?.mask);

  const dataVisualPreparing = preparing || undefined;
  const contentStyle = localPlacementStyle(item.placement);

  return (
    <div
      className={styles.Surface}
      style={style}
      inert={preparing}
      data-visual-preparing={dataVisualPreparing}
      data-visual-surface={item.id}
      data-surface-layout="local"
      data-visual-plane={item.depth.plane}
    >
      <div className={styles.Content} style={contentStyle} data-visual-content={item.id}>
        <Suspense fallback={<PendingVisualContent />}>
          {item.content}
        </Suspense>
      </div>
    </div>
  );
};
