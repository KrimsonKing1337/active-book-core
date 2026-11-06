import type { RefCallback } from 'react';

import { createContext, useContext } from 'react';

import type { VisualRegion } from '@active-book/types';

export type StoryRegion = Exclude<VisualRegion, 'application'>;
export type RegionElements = Partial<Record<StoryRegion, HTMLDivElement | null>>;
export type RegionRefs = Record<StoryRegion, RefCallback<HTMLDivElement>>;

export type StoryRegionsContextValue = {
  elements: RegionElements;
  hosts: RegionElements;
  refs: RegionRefs;
  hostRefs: RegionRefs;
};

export const StoryRegionsContext = createContext<StoryRegionsContextValue | null>(null);

export const useStoryRegions = () => {
  const context = useContext(StoryRegionsContext);

  if (!context) {
    throw new Error('Story regions require a BookSession');
  }

  return context;
};
