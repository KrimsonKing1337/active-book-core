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
  const isAnimated = animation?.preset !== undefined
    && animation.preset !== 'none'
    && animation.playState !== 'stopped';

  const thicknessPx = Math.max(0, thickness);
  const leftShadow = `inset ${thicknessPx}px 0 ${thicknessPx}px -${thicknessPx}px var(--side-shadow-color, currentColor)`;
  const rightShadow = `inset -${thicknessPx}px 0 ${thicknessPx}px -${thicknessPx}px var(--side-shadow-color, currentColor)`;

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
