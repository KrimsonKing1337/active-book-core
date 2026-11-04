import type { CSSProperties } from 'react';

import type { VisualRendererProps } from '@active-book/types';

import { useVisualRegionGeometry } from '@components/RegisteredVisualEffect/geometryContext';

import { useTimeline } from '../hooks/useTimeline';
import { numberParam, stringParam } from '../utils';

import * as styles from './Through.module.scss';

export const Through = (props: VisualRendererProps) => {
  const { progress, token } = useTimeline(props);
  const { geometry, surface } = useVisualRegionGeometry();
  const frame = geometry?.regions.narrativeFrame;
  const x = frame && surface ? frame.x - surface.x + frame.width / 2 : props.geometry.width / 2;
  const y = frame && surface ? frame.y - surface.y + frame.height : props.geometry.height / 2;
  const radius = Math.hypot(props.geometry.width, props.geometry.height) * progress;
  const stops = `transparent ${Math.max(0, radius - 110)}px, currentColor ${radius}px, `
    + `transparent ${radius + 120}px`;
  const style: CSSProperties = {
    background: `radial-gradient(circle at ${x}px ${y}px, ${stops})`,
    color: stringParam(props.params, 'color', '#75e1d5'),
    opacity: numberParam(props.params, 'intensity', 0.85)
      * numberParam(props.params, 'opacity', 1)
      * Math.sin(progress * Math.PI),
  };

  return (
    <div
      className={styles.Through}
      style={style}
      data-demo-effect={props.id}
      data-token={token}
    />
  );
};
