import { createContext, useContext } from 'react';

import type { StoryGeometry, StoryRegionRect } from '@components/StoryVisualRoot/geometry';

export const VisualRegionGeometryContext = createContext<{
  geometry: StoryGeometry | null;
  surface: StoryRegionRect | null;
}>({ geometry: null, surface: null });

/** Read-only, already measured regions for experimental multi-region renderers. No DOM refs. */
export const useVisualRegionGeometry = () => useContext(VisualRegionGeometryContext);
