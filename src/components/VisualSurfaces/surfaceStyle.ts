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
  const [x, y] = anchors[placement.anchor.point];
  const [originX, originY] = anchors[placement.origin];

  return {
    left: `calc(${x}% + ${length(placement.offset.x)})`,
    top: `calc(${y}% + ${length(placement.offset.y)})`,
    width: length(placement.size.width),
    height: length(placement.size.height),
    translate: `${-originX}% ${-originY}%`,
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
