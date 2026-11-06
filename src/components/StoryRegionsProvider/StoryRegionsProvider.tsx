import type { PropsWithChildren } from 'react';

import { useMemo, useState } from 'react';

import { StoryRegionsContext, type RegionElements, type RegionRefs, type StoryRegion } from './context';

const regions: readonly StoryRegion[] = [
  'story', 'storyViewport', 'storyViewportFrame', 'narrativeFrame', 'narrativeViewport', 'narrativeContent',
  'toolbarFrame', 'toolbar',
];

export const StoryRegionsProvider = ({ children }: PropsWithChildren) => {
  const [elements, setElements] = useState<RegionElements>({});
  const [hosts, setHosts] = useState<RegionElements>({});

  const refs = useMemo(() => {
    return Object.fromEntries(regions.map((regionCur) => [regionCur, (element: HTMLDivElement | null) => {
      setElements((previous) => {
        if (previous[regionCur] === element) {
          return previous;
        }

        return { ...previous, [regionCur]: element };
      });
    }])) as RegionRefs;
  }, []);

  const hostRefs = useMemo(() => {
    return Object.fromEntries(regions.map((regionCur) => [regionCur, (element: HTMLDivElement | null) => {
      setHosts((previous) => {
        if (previous[regionCur] === element) {
          return previous;
        }

        return { ...previous, [regionCur]: element };
      });
    }])) as RegionRefs;
  }, []);

  const value = useMemo(() => ({
    elements,
    hosts,
    refs,
    hostRefs,
  }), [elements, hosts, refs, hostRefs]);

  return (
    <StoryRegionsContext value={value}>
      {children}
    </StoryRegionsContext>
  );
};
