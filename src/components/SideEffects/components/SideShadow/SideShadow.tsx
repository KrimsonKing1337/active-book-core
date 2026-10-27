import type { CSSProperties, RefObject } from 'react';

import classNames from 'classnames';

import type { SideShadowItem } from '@hooks/effects/side/@types';

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
    thickness = 30,
  } = options;

  const preset = animation?.preset ?? 'none';
  const isAnimated = preset !== 'none' && animation?.playState !== 'stopped';

  const thicknessPx = Math.max(0, thickness);
  const size = `${thicknessPx}px`;

  const color = 'var(--side-shadow-color, currentColor)';

  const leftShadow = `inset ${size} 0 ${size} -${size} ${color}`;
  const rightShadow = `inset -${size} 0 ${size} -${size} ${color}`;

  const animationDuration = animation?.duration ?? 1000;
  const animationDelay = animation?.delay ?? 0;
  const animationIterationCount = animation?.iterations ?? 'infinite';
  const animationPlayState = animation?.playState === 'paused' ? 'paused' : 'running';

  const shadowStyle: CSSProperties = {
    ...style,
    boxShadow: `${leftShadow}, ${rightShadow}`,
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
