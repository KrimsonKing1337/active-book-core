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

  const animationStyle: CSSProperties = {
    animationDuration: `${animation?.duration ?? 1000}ms`,
    animationDelay: `${animation?.delay ?? 0}ms`,
    animationIterationCount: animation?.iterations ?? 'infinite',
    animationPlayState: animation?.playState === 'paused' ? 'paused' : 'running',
    animationName: animation?.playState === 'stopped' ? 'none' : undefined,
  };

  const className = [styles.AnimatedSideShadow, presets[preset]].filter(Boolean).join(' ');

  return (
    <div className={className} style={{ ...animationStyle, ...style }} />
  );
};
