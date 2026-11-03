import type { StoryRegionRect } from './@types';

type RegionCornersOptions = {
  region: StoryRegionRect;
  clip: StoryRegionRect;
  style: CSSStyleDeclaration;
};

/** Retain rounded clipping inherited from the containing player at coincident edges. */
export const getRegionCorners = ({
  region,
  clip,
  style,
}: RegionCornersOptions): string => {
  const top = Math.abs(region.y - clip.y) < 0.5;
  const right = Math.abs(region.x + region.width - clip.x - clip.width) < 0.5;
  const bottom = Math.abs(region.y + region.height - clip.y - clip.height) < 0.5;
  const left = Math.abs(region.x - clip.x) < 0.5;

  const topLeft = (left && top) ? style.borderTopLeftRadius : '0px';
  const topRight = (right && top) ? style.borderTopRightRadius : '0px';
  const bottomRight = (right && bottom) ? style.borderBottomRightRadius : '0px';
  const bottomLeft = (left && bottom) ? style.borderBottomLeftRadius : '0px';

  const corners = [
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
  ];

  return corners.join(' ');
};
