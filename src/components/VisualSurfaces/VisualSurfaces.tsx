import { createPortal } from 'react-dom';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import { useStoryRegions } from '@components/StoryRegionsProvider';
import { useBookApplicationSurface } from '@components/BookApplicationSurface';

import { compareVisualSurfaces } from '@components/VisualSurfaces/utils/order';

import { VisualSurface } from './components';


const layers: Record<VisualSurfaceItem['depth']['plane'], number> = {
  background: 0,
  belowNarrative: 1,
  aboveNarrative: 3,
  aboveControls: 5,
  systemFeedback: 6,
};

type VisualSurfacesProps = {
  items: readonly VisualSurfaceItem[];
  stride: number;
};

export const VisualSurfaces = ({ items, stride }: VisualSurfacesProps) => {
  const { hosts } = useStoryRegions();
  const application = useBookApplicationSurface();
  const sorted = [...items].sort(compareVisualSurfaces);

  return sorted.map((itemCur, index) => {
    const region = itemCur.placement.coordinates;
    const localRegion = region === 'frame' ? 'narrativeFrame' : region;
    const external = region === 'application';
    let target = localRegion === 'application' ? null : hosts[localRegion];

    if (external) {
      const underStory = itemCur.depth.plane === 'background';
      target = underStory ? application?.hosts.underStory : application?.hosts.aboveStory;
    }

    if (itemCur.depth.plane === 'systemFeedback') {
      target = application?.hosts.feedback ?? hosts.story;
    }

    if (!target) {
      return null;
    }

    const zIndex = layers[itemCur.depth.plane] * stride + index;

    return createPortal(<VisualSurface item={itemCur} zIndex={zIndex} />, target, itemCur.id);
  });
};
