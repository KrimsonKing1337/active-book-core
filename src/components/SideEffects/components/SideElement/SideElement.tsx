import type { CSSProperties, PropsWithChildren } from 'react';

import type { SideElementLayout } from 'hooks/effects/side/@types';

import { getPositionCoordinatesDefault } from './utils';

import * as styles from './SideElement.module.scss';

type SideElementProps = PropsWithChildren<SideElementLayout>;

const positionCoordinates = getPositionCoordinatesDefault();

export const SideElement = ({
  children,
  position = 'top-left',
  offsetX = '0px',
  offsetY = '0px',
  style: elementStyle,
  hidden = false,
}: SideElementProps) => {
  if (hidden) {
    return null;
  }

  const [
    left,
    top,
    shiftX,
    shiftY,
  ] = positionCoordinates[position];

  const zIndex = elementStyle?.zIndex;
  const transform = `translate(calc(${shiftX} + ${offsetX}), calc(${shiftY} + ${offsetY}))`;

  const positionStyle: CSSProperties = {
    left,
    top,
    zIndex,
    transform,
  };

  return (
    <div className={styles.SideElement} style={positionStyle}>
      {children}
    </div>
  );
};
