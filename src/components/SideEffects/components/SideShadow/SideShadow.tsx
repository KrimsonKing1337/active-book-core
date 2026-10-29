import type { CSSProperties, RefObject } from 'react';

import classNames from 'classnames';

import type { FrameSide, SideShadowItem } from '@hooks/effects/side/@types';

import * as styles from './SideShadow.module.scss';

export type SideShadowProps = {
  options: SideShadowItem;
  elementRef?: RefObject<HTMLDivElement | null>;
  className?: string;
};

export const SideShadow = ({ options, elementRef, className }: SideShadowProps) => {
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

  const color = 'var(--side-shadow-color, currentColor)';

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

  const sideShadowClassNames = classNames({
    [styles.SideShadow]: true,
    [styles.Pulse]: isAnimated,
  }, className);

  return (
    <div ref={elementRef} className={sideShadowClassNames} style={shadowStyle} />
  );
};
