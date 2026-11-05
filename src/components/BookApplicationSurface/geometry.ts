import type { StoryGeometry } from '@components/StoryRoot/geometry';

/** Both measured roots are untransformed; translation changes the host coordinate origin. */
export const geometryInApplication = (geometry: StoryGeometry | null): StoryGeometry | null => {
  const application = geometry?.regions.application;

  if (!geometry || !application) {
    return null;
  }

  const regions = { ...geometry.regions };

  for (const keyCur of Object.keys(regions) as (keyof typeof regions)[]) {
    const region = regions[keyCur];

    if (region) {
      regions[keyCur] = {
        ...region,
        x: region.x - application.x,
        y: region.y - application.y,
      };
    }
  }

  return { ...geometry, regions };
};
