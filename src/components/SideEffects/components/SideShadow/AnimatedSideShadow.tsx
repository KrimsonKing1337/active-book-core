import type { CSSProperties } from 'react';

import type { SideShadowItem } from 'hooks/effects/side/@types';

import * as styles from './AnimatedSideShadow.module.scss';

export type AnimatedSideShadowProps = {
  options: SideShadowItem;
};

const presets = {
  none: '',
  pulse: styles.Pulse,
  police: styles.Police,
  caramel: styles.Caramel,
  scroll: '',
};

export const AnimatedSideShadow = ({ options }: AnimatedSideShadowProps) => {
  const { animation, style } = options;
  const preset = animation?.preset ?? 'pulse';
  const duration = animation?.duration ?? 1000;
  const delay = animation?.delay ?? 0;
  const iterations = animation?.iterations ?? 'infinite';

  const colorsPerCycle = preset === 'police' ? 2 : preset === 'caramel' ? 7 : 1;
  const hasColorAnimation = colorsPerCycle > 1;
  const colorDuration = duration * colorsPerCycle;

  const colorIterations = iterations === 'infinite' ? 'infinite' : iterations / colorsPerCycle;

  const animationDuration = hasColorAnimation ? `${duration}ms, ${colorDuration}ms` : `${duration}ms`;
  const animationDelay = hasColorAnimation ? `${delay}ms, ${delay}ms` : `${delay}ms`;
  const animationIterations = hasColorAnimation ? `${iterations}, ${colorIterations}` : iterations;

  const animationStyle: CSSProperties = {
    ...style,
    animationDuration,
    animationDelay,
    animationIterationCount: animationIterations,
    animationPlayState: animation?.playState === 'paused' ? 'paused' : 'running',
    animationFillMode: 'forwards',
    animationName: animation?.playState === 'stopped' ? 'none' : undefined,
  };

  const className = [styles.AnimatedSideShadow, presets[preset]].filter(Boolean).join(' ');

  return (
    <div className={className} style={animationStyle} />
  );
};
