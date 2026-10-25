import type { CSSProperties } from 'react';

import { useEffect, useState } from 'react';

import type { SideShadowItem } from 'hooks/effects/side/@types';

import * as styles from './AnimatedSideShadow.module.scss';

export type AnimatedSideShadowProps = {
  options: SideShadowItem;
};

const POLICE_COLORS = ['red', 'blue'];
const CARAMEL_COLORS = [
  '#ff0000',
  '#ff7f00',
  '#ffff00',
  '#00ff00',
  '#0000ff',
  '#4b0082',
  '#9400d3',
];

export const AnimatedSideShadow = ({ options }: AnimatedSideShadowProps) => {
  const { animation, style, thickness = 30 } = options;
  const preset = animation?.preset ?? 'pulse';

  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    setColorIndex(0);
  }, [preset]);

  const handleAnimationIteration = () => {
    if (preset === 'police' || preset === 'caramel') {
      setColorIndex((current) => current + 1);
    }
  };

  let palette: string[] = [];

  if (preset === 'police') {
    palette = POLICE_COLORS;
  } else if (preset === 'caramel') {
    palette = CARAMEL_COLORS;
  }

  const color = palette.length > 0 ? palette[colorIndex % palette.length] : style?.color;
  const isAnimated = preset !== 'none' && animation?.playState !== 'stopped';

  const animationStyle: CSSProperties = {
    ...style,
    color,
    height: `calc(100% + ${thickness * 2}px)`,
    marginTop: -thickness,
    boxShadow: `inset 0 0 ${thickness}px currentColor`,
    animationDuration: `${animation?.duration ?? 1000}ms`,
    animationDelay: `${animation?.delay ?? 0}ms`,
    animationIterationCount: animation?.iterations ?? 'infinite',
    animationPlayState: animation?.playState === 'paused' ? 'paused' : 'running',
    animationFillMode: 'forwards',
  };

  const className = isAnimated
    ? `${styles.AnimatedSideShadow} ${styles.Pulse}`
    : styles.AnimatedSideShadow;

  return (
    <div
      className={className}
      style={animationStyle}
      onAnimationIteration={handleAnimationIteration}
    />
  );
};
