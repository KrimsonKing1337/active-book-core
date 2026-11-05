import type { VisualSurfaceItem } from '../@types';

export const compareVisualSurfaces = (first: VisualSurfaceItem, second: VisualSurfaceItem): number => {
  const firstOrder = first.depth.order ?? 0;
  const secondOrder = second.depth.order ?? 0;

  if (firstOrder !== secondOrder) {
    return firstOrder - secondOrder;
  }

  if (first.id === second.id) {
    return 0;
  }

  return first.id < second.id ? -1 : 1;
};
