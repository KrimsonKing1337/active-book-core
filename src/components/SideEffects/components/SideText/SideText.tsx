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

  const animationStyle: CSSProperties = {
    animationDuration: animation ? `${animation.duration ?? 60000}ms` : undefined,
    animationDelay: animation ? `${animation.delay ?? 0}ms` : undefined,
    animationIterationCount: animation?.iterations,
    animationPlayState: animation?.playState === 'paused' ? 'paused' : 'running',
    animationName: animation?.preset === 'none' || animation?.playState === 'stopped' ? 'none' : undefined,
    transform: animation?.preset === 'none' || animation?.playState === 'stopped' ? 'none' : undefined,
  };

  return (
    <div className={styles.SideTextScrollWrapper}>
      <div className={styles.SideTextScrollLeftWrapper}>
        <div className={styles.SideTextScrollLeft} style={animationStyle}>
          <div className={styles.SideTextScrollContent} style={style}>
            {childrenAsArray[0]}
          </div>
        </div>
      </div>

      <div className={styles.SideTextScrollRightWrapper}>
        <div className={styles.SideTextScrollRight} style={animationStyle}>
          <div className={styles.SideTextScrollContent} style={style}>
            {childrenAsArray[1]}
          </div>
        </div>
      </div>
    </div>
  );
};
