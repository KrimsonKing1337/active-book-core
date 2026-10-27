import { type CSSProperties, type PropsWithChildren, Children } from 'react';

import classNames from 'classnames';

import type { SideAnimation } from '@hooks/effects/side/@types';

import * as styles from './SideText.module.scss';

type SideTextProps = PropsWithChildren & {
  animation?: SideAnimation;
  style?: CSSProperties;
};

export const SideText = ({ children, animation, style }: SideTextProps) => {
  const childrenAsArray = Children.toArray(children);

  if (childrenAsArray.length !== 2) {
    throw new Error('There must be two children in SideText');
  }

  const isStatic = animation?.preset === 'none' || animation?.playState === 'stopped';

  const animationDuration = animation?.duration ?? 60000;
  const animationDelay = animation?.delay ?? 0;
  const animationIterationCount = animation?.iterations ?? 'infinite';
  const animationPlayState = animation?.playState === 'paused' ? 'paused' : 'running';
  const animationName = isStatic ? 'none' : undefined;

  const animationStyle: CSSProperties = {
    animationDuration: `${animationDuration}ms`,
    animationDelay: `${animationDelay}ms`,
    animationIterationCount,
    animationPlayState,
    animationName,
  };

  const leftClassNames = classNames({
    [styles.SideTextScrollLeft]: true,
    [styles.Static]: isStatic,
  });

  const rightClassNames = classNames({
    [styles.SideTextScrollRight]: true,
    [styles.Static]: isStatic,
  });

  return (
    <div className={styles.SideTextScrollWrapper}>
      <div className={styles.SideTextScrollLeftWrapper}>
        <div className={leftClassNames} style={animationStyle}>
          <div className={styles.SideTextScrollContent} style={style}>
            {childrenAsArray[0]}
          </div>
        </div>
      </div>

      <div className={styles.SideTextScrollRightWrapper}>
        <div className={rightClassNames} style={animationStyle}>
          <div className={styles.SideTextScrollContent} style={style}>
            {childrenAsArray[1]}
          </div>
        </div>
      </div>
    </div>
  );
};
