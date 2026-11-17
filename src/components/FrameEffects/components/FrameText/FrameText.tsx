import {
  type CSSProperties,
  type PropsWithChildren,
  Children,
} from 'react';

import classNames from 'classnames';

import type { FrameAnimation } from '@hooks/effects/frame/@types';

import * as styles from './FrameText.module.scss';

type FrameTextProps = PropsWithChildren & {
  animation?: FrameAnimation;
  style?: CSSProperties;
};

export const FrameText = ({
  children,
  animation,
  style,
}: FrameTextProps) => {
  const childrenAsArray = Children.toArray(children);

  if (childrenAsArray.length !== 2) {
    throw new Error('There must be two children in FrameText');
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
    [styles.FrameTextScrollLeft]: true,
    [styles.Static]: isStatic,
  });

  const rightClassNames = classNames({
    [styles.FrameTextScrollRight]: true,
    [styles.Static]: isStatic,
  });

  return (
    <div className={styles.FrameTextScrollWrapper}>
      <div className={styles.FrameTextScrollLeftWrapper}>
        <div className={leftClassNames} style={animationStyle}>
          <div className={styles.FrameTextScrollContent} style={style}>
            {childrenAsArray[0]}
          </div>
        </div>
      </div>

      <div className={styles.FrameTextScrollRightWrapper}>
        <div className={rightClassNames} style={animationStyle}>
          <div className={styles.FrameTextScrollContent} style={style}>
            {childrenAsArray[1]}
          </div>
        </div>
      </div>
    </div>
  );
};
