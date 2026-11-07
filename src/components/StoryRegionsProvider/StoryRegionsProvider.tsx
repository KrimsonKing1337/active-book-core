import { type PropsWithChildren, useMemo, useState } from 'react';

import {
  type RegionElements,
  type RegionRefs,
  type StoryRegion,
  StoryRegionsContext,
} from './context';

const regions: readonly StoryRegion[] = [
  'story',
  'storyViewport',
  'storyViewportFrame',
  'narrativeFrame',
  'narrativeViewport',
  'narrativeContent',
  'toolbarFrame',
  'toolbar',
];

export const StoryRegionsProvider = ({ children }: PropsWithChildren) => {
  const [elements, setElements] = useState<RegionElements>({});
  const [hosts, setHosts] = useState<RegionElements>({});

  const refs = useMemo(() => {
    const regionRefs = {} as RegionRefs;

    for (const regionCur of regions) {
      regionRefs[regionCur] = (element: HTMLDivElement | null) => {
        setElements((previousElements) => {
          if (previousElements[regionCur] === element) {
            return previousElements;
          }

          return {
            ...previousElements,
            [regionCur]: element,
          };
        });
      };
    }

    return regionRefs;
  }, []);

  const hostRefs = useMemo(() => {
    const regionRefs = {} as RegionRefs;

    for (const regionCur of regions) {
      regionRefs[regionCur] = (element: HTMLDivElement | null) => {
        setHosts((previousHosts) => {
          if (previousHosts[regionCur] === element) {
            return previousHosts;
          }

          return {
            ...previousHosts,
            [regionCur]: element,
          };
        });
      };
    }

    return regionRefs;
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
