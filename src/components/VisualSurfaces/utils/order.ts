import type { VisualSurfaceItem } from '../@types';

export const compareVisualSurfaces = (first: VisualSurfaceItem, second: VisualSurfaceItem): number => {
  if (first.depth.order !== second.depth.order) {
    return first.depth.order - second.depth.order;
  }

  if (first.id === second.id) {
    return 0;
  }

  return first.id < second.id ? -1 : 1;
};
