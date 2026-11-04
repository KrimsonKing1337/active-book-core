import type { CSSProperties } from 'react';

import { useRef } from 'react';

import type { VisualRendererProps } from '@active-book/types';


import type { LayoutLease } from '@controllers/visualEffects';

import { useBookApplicationSurface } from '@components/BookApplicationSurface';
import { useVisualRegionGeometry } from '@components/RegisteredVisualEffect/geometryContext';

import { useTimeline } from '../hooks/useTimeline';
import { numberParam, stringParam } from '../utils';

import * as styles from './SingleScene.module.scss';

/** Same artistic scene with one renderer/clock instead of a sequence of registrations. */
export const SingleScene = (props: VisualRendererProps) => {
  const application = useBookApplicationSurface();
  const leaseRef = useRef<LayoutLease | null>(null);
  const mode = props.params.physicalMode === 'size' ? 'size' : 'scale';
  const {
    progress,
    token,
    active,
  } = useTimeline(props, {
    frame: (next) => {
      if (next > 0.5 && next < 0.85) {
        leaseRef.current ??= application?.layout.acquire(mode) ?? null;
        const stage = (next - 0.5) / 0.35;
        leaseRef.current?.update(Math.max(0, Math.abs(stage * 2 - 1) * 1.3 - 0.3));
      } else {
        leaseRef.current?.release();
        leaseRef.current = null;
      }
    },
    finish: () => {
      leaseRef.current?.release();
      leaseRef.current = null;
    },
  });
  const { geometry, surface } = useVisualRegionGeometry();
  const frame = geometry?.regions.narrativeFrame;
  const x = frame && surface ? frame.x - surface.x + frame.width / 2 : props.geometry.width / 2;
  const y = frame && surface ? frame.y - surface.y + frame.height / 2 : props.geometry.height / 2;
  const radius = Math.hypot(props.geometry.width, props.geometry.height);
  const spread = Math.min(1, progress / 0.5);
  const fadeOpacity = progress > 0.85 ? (1 - progress) / 0.15 : 1;
  const style: CSSProperties = {
    backgroundColor: stringParam(props.params, 'color', '#11131f'),
    clipPath: `circle(${spread * radius}px at ${x}px ${y}px)`,
    opacity: active ? fadeOpacity * numberParam(props.params, 'opacity', 1) : 0,
  };

  return (
    <div
      className={styles.Scene}
      style={style}
      data-demo-effect={props.id}
      data-token={token}
    />
  );
};
