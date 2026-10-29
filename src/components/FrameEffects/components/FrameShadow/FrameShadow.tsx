import type { CSSProperties, RefObject } from 'react';

import type { FrameSide, FrameShadowItem } from '@hooks/effects/frame/@types';

import classNames from 'classnames';

import * as styles from './FrameShadow.module.scss';

export type FrameShadowProps = {
  options: FrameShadowItem;
  elementRef?: RefObject<HTMLDivElement | null>;
  className?: string;
};

export const FrameShadow = ({ options, elementRef, className }: FrameShadowProps) => {
  const {
    animation,
    style,
    sides,
    thickness = 30,
  } = options;

  const preset = animation?.preset ?? 'none';
  const isAnimated = preset !== 'none' && animation?.playState !== 'stopped';

  const thicknessPx = Math.max(0, thickness);
  const size = `${thicknessPx}px`;

  const color = 'var(--frame-shadow-color, currentColor)';

  const shadows: Record<FrameSide, string> = {
    top: `inset 0 ${size} ${size} -${size} ${color}`,
    right: `inset -${size} 0 ${size} -${size} ${color}`,
    bottom: `inset 0 -${size} ${size} -${size} ${color}`,
    left: `inset ${size} 0 ${size} -${size} ${color}`,
  };

  const boxShadow = sides.map((sideCur) => shadows[sideCur]).join(', ');

  const animationDuration = animation?.duration ?? 1000;
  const animationDelay = animation?.delay ?? 0;
  const animationIterationCount = animation?.iterations ?? 'infinite';
  const animationPlayState = animation?.playState === 'paused' ? 'paused' : 'running';

  const shadowStyle: CSSProperties = {
    ...style,
    boxShadow,
    animationDuration: `${animationDuration}ms`,
    animationDelay: `${animationDelay}ms`,
    animationIterationCount,
    animationPlayState,
    animationFillMode: 'forwards',
  };

  const frameShadowClassNames = classNames({
    [styles.FrameShadow]: true,
    [styles.Pulse]: isAnimated,
  }, className);

  return (
    <div ref={elementRef} className={frameShadowClassNames} style={shadowStyle} />
  );
};
