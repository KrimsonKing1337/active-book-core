import type { CSSProperties, RefObject } from 'react';

import type { SideShadowItem } from 'hooks/effects/side/@types';

import * as styles from './SideShadow.module.scss';

export type SideShadowProps = {
  options: SideShadowItem;
  elementRef?: RefObject<HTMLDivElement | null>;
  className?: string;
};

export const SideShadow = ({ options, elementRef, className }: SideShadowProps) => {
  const { animation, style, thickness = 30 } = options;
  const preset = animation?.preset ?? 'none';
  const isAnimated = preset !== 'none' && animation?.playState !== 'stopped';

  const thicknessPx = Math.max(0, thickness);
  const size = `${thicknessPx}px`;
  const color = 'var(--side-shadow-color, currentColor)';

  const leftShadow = `inset ${size} 0 ${size} -${size} ${color}`;
  const rightShadow = `inset -${size} 0 ${size} -${size} ${color}`;

  const shadowStyle: CSSProperties = {
    ...style,
    boxShadow: `${leftShadow}, ${rightShadow}`,
    animationDuration: `${animation?.duration ?? 1000}ms`,
    animationDelay: `${animation?.delay ?? 0}ms`,
    animationIterationCount: animation?.iterations ?? 'infinite',
    animationPlayState: animation?.playState === 'paused' ? 'paused' : 'running',
    animationFillMode: 'forwards',
  };

  const classNames = [
    styles.SideShadow,
    isAnimated ? styles.Pulse : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div ref={elementRef} className={classNames} style={shadowStyle} />
  );
};
