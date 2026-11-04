import type { VisualSurfaceItem } from '../@types';

/** This experiment intentionally supports only shared-layout region fills. */
export const supportsCssLayout = ({ placement, visibility }: VisualSurfaceItem): boolean => {
  const coordinates = placement.coordinates;
  const hasCoordinates = coordinates === 'storyViewport' || coordinates === 'narrativeFrame';
  const hasVisibility = ['storyViewport', 'narrativeFrame', 'frame'].includes(visibility.region);
  const hasAnchor = placement.anchor.region === coordinates && placement.anchor.point === 'top-left';
  const hasOrigin = placement.origin === 'top-left';
  const hasOffset = placement.offset.x.value === 0 && placement.offset.y.value === 0;
  const hasWidth = placement.size.width.unit === '%' && placement.size.width.value === 100;
  const hasHeight = placement.size.height.unit === '%' && placement.size.height.value === 100;

  return hasCoordinates && hasVisibility && hasAnchor && hasOrigin && hasOffset
    && hasWidth && hasHeight && !visibility.mask;
};
