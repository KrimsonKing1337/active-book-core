import type { BookRegionRect } from './@types';

type RegionCornersOptions = {
  region: BookRegionRect;
  clip: BookRegionRect;
  style: CSSStyleDeclaration;
};

/** Retain rounded clipping inherited from the containing player at coincident edges. */
export const getRegionCorners = ({ region, clip, style }: RegionCornersOptions): string => {
  const left = Math.abs(region.x - clip.x) < 0.5;
  const top = Math.abs(region.y - clip.y) < 0.5;
  const right = Math.abs(region.x + region.width - clip.x - clip.width) < 0.5;
  const bottom = Math.abs(region.y + region.height - clip.y - clip.height) < 0.5;
  const corners = [
    left && top ? style.borderTopLeftRadius : '0px',
    right && top ? style.borderTopRightRadius : '0px',
    right && bottom ? style.borderBottomRightRadius : '0px',
    left && bottom ? style.borderBottomLeftRadius : '0px',
  ];

  return corners.join(' ');
};
