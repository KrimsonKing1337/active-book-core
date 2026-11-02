import type { BookGeometry } from '@components/BookVisualRoot/geometry';

import { getFrameMaskImage } from '@components/FrameEffects/utils';

import type { ResolvedVisualSurface, VisibilityStyle, VisualSurfaceItem } from '../@types';

import { resolvePlacement } from './placement';
import { resolveShapeMask } from './masks';

type ResolveVisualSurfaceParams = {
  item: VisualSurfaceItem;
  geometry: BookGeometry | null;
};

export const resolveVisualSurface = ({ item, geometry }: ResolveVisualSurfaceParams): ResolvedVisualSurface | null => {
  if (!geometry) {
    return null;
  }

  const surface = resolvePlacement(item.placement, geometry);
  const region = geometry.regions[item.visibility.region];

  if (!surface || !region) {
    return null;
  }

  const visibilityStyle: VisibilityStyle = {
    left: region.x,
    top: region.y,
    width: region.width,
    height: region.height,
    borderRadius: region.borderRadius,
  };

  if (item.visibility.region === 'frame') {
    const insets = geometry.frameInsets;

    if (!insets) {
      return null;
    }

    visibilityStyle.maskImage = getFrameMaskImage([...item.visibility.sides]);
    visibilityStyle.maskComposite = 'add';

    visibilityStyle['--frame-top'] = `${insets.top}px`;
    visibilityStyle['--frame-right'] = `${insets.right}px`;
    visibilityStyle['--frame-bottom'] = `${insets.bottom}px`;
    visibilityStyle['--frame-left'] = `${insets.left}px`;
  }

  if (item.visibility.mask) {
    const clipPath = resolveShapeMask(item.visibility.mask, region);

    if (!clipPath) {
      return null;
    }

    visibilityStyle.clipPath = clipPath;
  }

  const surfaceStyle = {
    left: surface.x - region.x,
    top: surface.y - region.y,
    width: surface.width,
    height: surface.height,
  };

  return {
    visibilityStyle,
    surfaceStyle,
  };
};
