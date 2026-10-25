import type { CSSProperties, PropsWithChildren } from 'react';

import { Children } from 'react';

import type { SideAnimation } from 'hooks/effects/side/@types';

import * as styles from './SideText.module.scss';

type SideTextProps = PropsWithChildren<{
  animation?: SideAnimation;
  style?: CSSProperties;
}>;

export const SideText = ({ children, animation, style }: SideTextProps) => {
  const childrenAsArray = Children.toArray(children);

  if (childrenAsArray.length !== 2) {
    throw new Error('There must be two children in SideText');
  }

  const isStatic = animation?.preset === 'none' || animation?.playState === 'stopped';

  const animationStyle: CSSProperties = {
    animationDuration: animation?.duration === undefined
      ? 'var(--side-scroll-text-animation-speed, 60000ms)'
      : `${animation.duration}ms`,
    animationDelay: `${animation?.delay ?? 0}ms`,
    animationIterationCount: animation?.iterations ?? 'infinite',
    animationPlayState: animation?.playState === 'paused' ? 'paused' : 'running',
    animationName: isStatic ? 'none' : undefined,
  };

  const leftClassName = [
    styles.SideTextScrollLeft,
    isStatic ? styles.Static : '',
  ].filter(Boolean).join(' ');

  const rightClassName = [
    styles.SideTextScrollRight,
    isStatic ? styles.Static : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.SideTextScrollWrapper}>
      <div className={styles.SideTextScrollLeftWrapper}>
        <div className={leftClassName} style={animationStyle}>
          <div className={styles.SideTextScrollContent} style={style}>
            {childrenAsArray[0]}
          </div>
        </div>
      </div>

      <div className={styles.SideTextScrollRightWrapper}>
        <div className={rightClassName} style={animationStyle}>
          <div className={styles.SideTextScrollContent} style={style}>
            {childrenAsArray[1]}
          </div>
        </div>
      </div>
    </div>
  );
};
