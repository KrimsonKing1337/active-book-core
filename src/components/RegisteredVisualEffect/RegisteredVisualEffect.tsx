import { memo, useLayoutEffect, useMemo, useRef } from 'react';

import type { VisualEffectDefinition, VisualEffectInstance, VisualGeometry, VisualPlayback } from '@active-book/types';

import type { VisualEffects } from '@controllers/visualEffects';

import type { StoryGeometry, StoryRegionRect } from '@components/StoryVisualRoot/geometry';
import { resolvePlacement } from '@components/VisualSurfaces/utils';

import { VisualRegionGeometryContext } from './geometryContext';

type RegisteredVisualEffectProps = {
  effect: VisualEffectInstance;
  definition: VisualEffectDefinition;
  visualEffects: VisualEffects;
  geometry: StoryGeometry | null;
};

export const RegisteredVisualEffect = memo(({
  effect,
  definition,
  visualEffects,
  geometry,
}: RegisteredVisualEffectProps) => {
  const { id, params } = effect;
  const { Renderer, defaultParams } = definition;

  const playbackRef = useRef<VisualPlayback | null>(null);

  const previousGeometry = useRef<VisualGeometry>({
    width: 0,
    height: 0,
  });

  const bounds = useMemo<StoryRegionRect | null>(() => {
    return geometry ? resolvePlacement(effect.placement, geometry) : null;
  }, [effect.placement, geometry]);

  const width = bounds?.width ?? previousGeometry.current.width;
  const height = bounds?.height ?? previousGeometry.current.height;

  const rendererGeometry = useMemo(() => {
    return {
      width,
      height,
    };
  }, [width, height]);

  const resolvedParams = useMemo(() => {
    return {
      ...defaultParams,
      ...params,
    };
  }, [defaultParams, params]);

  useLayoutEffect(() => {
    previousGeometry.current = rendererGeometry;
  }, [rendererGeometry]);

  useLayoutEffect(() => {
    const readPlayback = () => playbackRef.current;

    return visualEffects.attachController({
      id,
      readPlayback,
    });
  }, [id, visualEffects]);

  // Keep the renderer element stable on unrelated updates, mask changes and scrolling geometry.
  const content = useMemo(() => (
    <Renderer
      id={id}
      params={resolvedParams}
      geometry={rendererGeometry}
      ref={playbackRef}
    />
  ), [id, resolvedParams, rendererGeometry, Renderer]);

  const regionContext = useMemo(() => {
    return { geometry, surface: bounds };
  }, [geometry, bounds]);

  return (
    <VisualRegionGeometryContext value={regionContext}>
      {content}
    </VisualRegionGeometryContext>
  );
});
