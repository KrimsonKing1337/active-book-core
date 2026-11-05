import { type CSSProperties, useRef } from 'react';

import type { VisualRendererProps } from '@active-book/types';

import { useAnimationPlayback } from '../hooks/useAnimationPlayback';
import { numberParam, stringParam } from '../utils';

import * as styles from './Smoke.module.scss';

export const Smoke = (props: VisualRendererProps) => {
  const cloudRef = useRef<HTMLDivElement>(null);
  const { token,playing } = useAnimationPlayback(props, () => {
    const cloud = cloudRef.current;

    if (!cloud) {
      throw new Error('Smoke cloud is not attached');
    }

    const animation = cloud.animate([
      { opacity: 0 },
      { opacity: 1, offset: 0.08 },
      { opacity: 1, offset: 0.92 },
      { opacity: 0 },
    ], {
      duration: numberParam(props.params, 'duration', 2000),
      fill: 'both',
    });

    return { animations: [animation] };
  });
  const count = Math.round(6 + numberParam(props.params, 'intensity', 0.8) * 20);
  const duration = 2500 / numberParam(props.params, 'speed', 1);
  const particles = Array.from({ length: count }, (_, index) => index);
  const style: CSSProperties = {
    color: stringParam(props.params, 'color', '#c8d9e9'),
    opacity: numberParam(props.params, 'opacity', 1),
  };

  return (
    <div
      className={styles.Smoke}
      style={style}
      data-demo-effect={props.id}
      data-token={token}
    >
      <div ref={cloudRef} className={styles.Cloud}>
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
    </div>
  );
};
