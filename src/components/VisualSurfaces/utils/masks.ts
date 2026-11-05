import type { VisualMask } from '@active-book/types';

import type { StoryRegionRect } from '@components/StoryRoot/geometry';

import { resolveVisualLength } from './placement';

export const resolveShapeMask = (mask: VisualMask, region: StoryRegionRect): string | null => {
  if (mask.type === 'circle') {
    const x = resolveVisualLength(mask.center.x, region.width);
    const y = resolveVisualLength(mask.center.y, region.height);
    const radius = resolveVisualLength(mask.radius, Math.min(region.width, region.height));

    const hasFiniteCircle = [x, y, radius].every(Number.isFinite);

    if (!hasFiniteCircle || radius < 0) {
      return null;
    }

    return `circle(${radius}px at ${x}px ${y}px)`;
  }

  if (mask.points.length < 3) {
    return null;
  }

  const points: string[] = [];

  for (const pointCur of mask.points) {
    const x = resolveVisualLength(pointCur.x, region.width);
    const y = resolveVisualLength(pointCur.y, region.height);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    points.push(`${x}px ${y}px`);
  }

  return `polygon(${points.join(', ')})`;
};
