import type { CSSProperties, PropsWithChildren } from 'react';

import type { SideElementLayout, SidePosition } from 'hooks/effects/side/@types';

import * as styles from './SideElement.module.scss';

type SideElementProps = PropsWithChildren<SideElementLayout>;

const positionCoordinates: Record<SidePosition, [string, string, string, string]> = {
  'top-left': ['0%', '0%', '0%', '0%'],
  top: ['50%', '0%', '-50%', '0%'],
  'top-right': ['100%', '0%', '-100%', '0%'],
  left: ['0%', '50%', '0%', '-50%'],
  center: ['50%', '50%', '-50%', '-50%'],
  right: ['100%', '50%', '-100%', '-50%'],
  'bottom-left': ['0%', '100%', '0%', '-100%'],
  bottom: ['50%', '100%', '-50%', '-100%'],
  'bottom-right': ['100%', '100%', '-100%', '-100%'],
};

export const SideElement = ({
  children,
  position = 'top-left',
  offsetX = '0px',
  offsetY = '0px',
  scale = 1,
  style: elementStyle,
  hidden = false,
}: SideElementProps) => {
  if (hidden) {
    return null;
  }

  const [left, top, shiftX, shiftY] = positionCoordinates[position];

  const positionStyle: CSSProperties = {
    left,
    top,
    zIndex: elementStyle?.zIndex,
    transform: `translate(calc(${shiftX} + ${offsetX}), calc(${shiftY} + ${offsetY})) scale(${scale})`,
  };

  return (
    <div className={styles.SideElement} style={positionStyle}>
      {children}
    </div>
  );
};
