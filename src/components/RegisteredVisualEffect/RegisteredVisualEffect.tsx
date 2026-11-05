import { memo, useLayoutEffect, useMemo, useRef } from 'react';

import type {
  VisualEffectDefinition, VisualEffectInstance, VisualPlayback, VisualRegionElements,
} from '@active-book/types';

import type { VisualEffects } from '@controllers/visualEffects';

import { useStoryRegions } from '@components/StoryRegionsProvider';
import { useBookApplicationSurface } from '@components/BookApplicationSurface';

type RegisteredVisualEffectProps = {
  effect: VisualEffectInstance;
  definition: VisualEffectDefinition;
  visualEffects: VisualEffects;
};

export const RegisteredVisualEffect = memo(({
  effect,
  definition,
  visualEffects,
}: RegisteredVisualEffectProps) => {
  const { id, params } = effect;
  const { Renderer, defaultParams } = definition;
  const { elements } = useStoryRegions();
  const application = useBookApplicationSurface();
  const applicationElement = application?.element ?? null;
  const playbackRef = useRef<VisualPlayback | null>(null);
  const regions = useMemo<VisualRegionElements>(() => ({
    application: applicationElement,
    story: elements.story ?? null,
    storyViewport: elements.storyViewport ?? null,
    narrativeFrame: elements.narrativeFrame ?? null,
    frame: elements.narrativeFrame ?? null,
    narrativeViewport: elements.narrativeViewport ?? null,
    narrativeContent: elements.narrativeContent ?? null,
  }), [elements, applicationElement]);
  const resolvedParams = useMemo(() => ({
    ...defaultParams,
    ...params,
  }), [defaultParams, params]);

  useLayoutEffect(() => {
    const readPlayback = () => playbackRef.current;

    return visualEffects.attachController({ id, readPlayback });
  }, [id, visualEffects]);

  return (
    <Renderer
      id={id}
      params={resolvedParams}
      regions={regions}
      ref={playbackRef}
    />
  );
});
