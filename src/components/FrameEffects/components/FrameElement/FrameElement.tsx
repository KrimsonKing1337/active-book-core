import type { CSSProperties, PropsWithChildren } from 'react';

import type { FrameElementLayout } from '@hooks/effects/frame/@types';

import { getPositionCoordinatesDefault } from './utils';

import * as styles from './FrameElement.module.scss';

type FrameElementProps = PropsWithChildren<FrameElementLayout>;

const positionCoordinates = getPositionCoordinatesDefault();

export const FrameElement = ({
  children,
  position = 'top-left',
  offsetX = '0px',
  offsetY = '0px',
  hidden = false,
}: FrameElementProps) => {
  if (hidden) {
    return null;
  }

  const [
    left,
    top,
    shiftX,
    shiftY,
  ] = positionCoordinates[position];

  const transform = `translate(calc(${shiftX} + ${offsetX}), calc(${shiftY} + ${offsetY}))`;

  const positionStyle: CSSProperties = {
    left,
    top,
    transform,
  };

  return (
    <div className={styles.FrameElement} style={positionStyle}>
      {children}
    </div>
  );
};
