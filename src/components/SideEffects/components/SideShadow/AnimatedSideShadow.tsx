import type { CSSProperties, RefObject } from 'react';

import type { SideShadowItem } from 'hooks/effects/side/@types';

import * as styles from './AnimatedSideShadow.module.scss';

export type AnimatedSideShadowProps = {
  options: SideShadowItem;
  elementRef?: RefObject<HTMLDivElement | null>;
  className?: string;
};

export const AnimatedSideShadow = ({ options, elementRef, className }: AnimatedSideShadowProps) => {
  const { animation, style, thickness = 30 } = options;
  const isAnimated = animation?.preset !== 'none' && animation?.playState !== 'stopped';

  const animationStyle: CSSProperties = {
    ...style,
    height: `calc(100% + ${thickness * 2}px)`,
    marginTop: -thickness,
    boxShadow: `inset 0 0 ${thickness}px var(--side-shadow-color, currentColor)`,
    animationDuration: `${animation?.duration ?? 1000}ms`,
    animationDelay: `${animation?.delay ?? 0}ms`,
    animationIterationCount: animation?.iterations ?? 'infinite',
    animationPlayState: animation?.playState === 'paused' ? 'paused' : 'running',
    animationFillMode: 'forwards',
  };

  const classNames = [
    styles.AnimatedSideShadow,
    isAnimated ? styles.Pulse : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div ref={elementRef} className={classNames} style={animationStyle} />
  );
};
