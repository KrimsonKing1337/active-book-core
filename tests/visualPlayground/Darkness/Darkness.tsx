import type { CSSProperties } from 'react';

import type { VisualRendererProps } from '@active-book/types';

import { useVisualRegionGeometry } from '@components/RegisteredVisualEffect/geometryContext';

import { useTimeline } from '../hooks/useTimeline';
import { numberParam, stringParam } from '../utils';

import * as styles from './Darkness.module.scss';

export const Darkness = (props: VisualRendererProps) => {
  const {
    progress,
    token,
    active,
  } = useTimeline(props);
  const { geometry, surface } = useVisualRegionGeometry();
  const { params, id } = props;
  const direction = stringParam(params, 'direction', 'grow');
  const region = geometry?.regions.storyViewport;
  const originX = numberParam(params, 'originX', 50) / 100;
  const originY = numberParam(params, 'originY', 50) / 100;
  const width = props.geometry.width;
  const height = props.geometry.height;
  const x = region && surface ? region.x - surface.x + region.width * originX : width * originX;
  const y = region && surface ? region.y - surface.y + region.height * originY : height * originY;
  const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
  const amount = direction === 'shrink' ? 1 - progress : progress;
  const color = stringParam(params, 'color', '#11131f');
  const intensity = numberParam(params, 'intensity', 1);
  const edges = params.edges === true;
  let maskImage: string | undefined;
  let clipPath: string | undefined;

  if (direction === 'reveal') {
    const hole = progress * radius;
    const center = `${x}px ${y}px`;
    maskImage = `radial-gradient(circle at ${center}, transparent ${hole}px, black ${hole + 1}px)`;
  } else if (edges) {
    const inside = Math.max(0, 100 - progress * 160);
    const outside = Math.max(0, 101 - progress * 160);
    maskImage = `radial-gradient(ellipse at center, transparent ${inside}%, black ${outside}%)`;
  } else {
    clipPath = `circle(${amount * radius}px at ${x}px ${y}px)`;
  }

  const style: CSSProperties = {
    backgroundColor: color,
    opacity: intensity * numberParam(params, 'opacity', 1),
    clipPath,
    maskImage,
    visibility: active ? 'visible' : 'hidden',
  };

  return (
    <div
      className={styles.Darkness}
      style={style}
      data-demo-effect={id}
      data-token={token}
      data-progress={progress.toFixed(3)}
    />
  );
};
