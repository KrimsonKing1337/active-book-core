import type { CSSProperties } from 'react';

import type { AnchorPoint, VisualLength, VisualMask, VisualPlacement } from '@active-book/types';

const anchors: Record<AnchorPoint, readonly [number, number]> = {
  'top-left': [0, 0],
  top: [50, 0],
  'top-right': [100, 0],
  left: [0, 50],
  center: [50, 50],
  right: [100, 50],
  'bottom-left': [0, 100],
  bottom: [50, 100],
  'bottom-right': [100, 100],
};

const length = (value: VisualLength) => `${value.value}${value.unit}`;

/** CSS values only: the containing DOM region supplies all dimensions. */
export const localPlacementStyle = (placement: VisualPlacement): CSSProperties => {
  const {
    anchor,
    origin,
    offset,
    size,
    scale,
    rotate,
  } = placement;

  if (!anchor && !origin && !offset && !size && scale === undefined && rotate === undefined) {
    return {};
  }

  const [x, y] = anchors[anchor ?? 'top-left'];
  const [originX, originY] = anchors[origin ?? anchor ?? 'top-left'];

  return {
    inset: 'auto',
    left: `calc(${x}% + ${offset ? length(offset.x) : '0px'})`,
    top: `calc(${y}% + ${offset ? length(offset.y) : '0px'})`,
    width: size ? length(size.width) : '100%',
    height: size ? length(size.height) : '100%',
    translate: `${-originX}% ${-originY}%`,
    transformOrigin: `${originX}% ${originY}%`,
    scale,
    rotate: rotate === undefined ? undefined : `${rotate}deg`,
  };
};

export const localClipPath = (mask?: VisualMask): string | undefined => {
  if (!mask) {
    return undefined;
  }

  if (mask.type === 'circle') {
    return `circle(${length(mask.radius)} at ${length(mask.center.x)} ${length(mask.center.y)})`;
  }

  const points = mask.points.map((cur) => `${length(cur.x)} ${length(cur.y)}`);

  return `polygon(${points.join(', ')})`;
};
