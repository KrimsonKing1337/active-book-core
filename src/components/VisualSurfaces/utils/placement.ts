import type { AnchorPoint, VisualLength, VisualPlacement } from '@active-book/types';

import type { StoryGeometry, StoryRegionRect } from '@components/StoryRoot/geometry';

const anchorPoints: Record<AnchorPoint, readonly [number, number]> = {
  'top-left': [0, 0],
  top: [0.5, 0],
  'top-right': [1, 0],
  left: [0, 0.5],
  center: [0.5, 0.5],
  right: [1, 0.5],
  'bottom-left': [0, 1],
  bottom: [0.5, 1],
  'bottom-right': [1, 1],
};

export const resolveVisualLength = (length: VisualLength, reference: number): number => {
  return length.unit === '%' ? (reference * length.value / 100) : length.value;
};

export const resolvePlacement = (placement: VisualPlacement, geometry: StoryGeometry): StoryRegionRect | null => {
  const coordinates = geometry.regions[placement.coordinates];
  const anchor = geometry.regions[placement.anchor.region];

  if (!coordinates || !anchor) {
    return null;
  }

  const width = resolveVisualLength(placement.size.width, coordinates.width);
  const height = resolveVisualLength(placement.size.height, coordinates.height);
  const offsetX = resolveVisualLength(placement.offset.x, coordinates.width);
  const offsetY = resolveVisualLength(placement.offset.y, coordinates.height);

  const [anchorX, anchorY] = anchorPoints[placement.anchor.point];
  const [originX, originY] = anchorPoints[placement.origin];

  // The anchor is already measured in book coordinates, avoiding a round trip through local coordinates.
  const x = anchor.x + anchorX * anchor.width - originX * width + offsetX;
  const y = anchor.y + anchorY * anchor.height - originY * height + offsetY;

  const hasFiniteBounds = [x, y, width, height].every(Number.isFinite);

  if (!hasFiniteBounds || width < 0 || height < 0) {
    return null;
  }

  return {
    x,
    y,
    width,
    height,
  };
};
