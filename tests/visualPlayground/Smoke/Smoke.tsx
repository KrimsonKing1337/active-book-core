import type { CSSProperties } from 'react';

import type { VisualRendererProps } from '@active-book/types';

import { useTimeline } from '../hooks/useTimeline';
import { numberParam, stringParam } from '../utils';

import * as styles from './Smoke.module.scss';

export const Smoke = (props: VisualRendererProps) => {
  const {
    progress,
    token,
    playing,
  } = useTimeline(props);
  const count = Math.round(6 + numberParam(props.params, 'intensity', 0.8) * 20);
  const duration = numberParam(props.params, 'duration', 2000);
  const particles = Array.from({ length: count }, (_, index) => index);
  const style: CSSProperties = {
    color: stringParam(props.params, 'color', '#c8d9e9'),
    opacity: progress > 0 && progress < 1 ? 1 : 0,
  };

  return (
    <div
      className={styles.Smoke}
      style={style}
      data-demo-effect={props.id}
      data-token={token}
    >
      {particles.map((particleCur) => {
        const particleStyle = {
          left: `${12 + (particleCur * 37) % 77}%`,
          '--drift': `${(particleCur % 2 === 0 ? -1 : 1) * (90 + particleCur * 7)}px`,
          '--rise': `${250 + particleCur * 19}px`,
          animationDuration: `${duration * (0.7 + (particleCur % 5) * 0.15)}ms`,
          animationDelay: `${-particleCur * duration / count}ms`,
          animationPlayState: playing ? 'running' : 'paused',
        } as CSSProperties;

        return <i key={particleCur} className={styles.Puff} style={particleStyle} />;
      })}
    </div>
  );
};
