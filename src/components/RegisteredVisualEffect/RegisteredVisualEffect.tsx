import { memo, useLayoutEffect, useMemo, useRef } from 'react';

import type { VisualEffectInstance, VisualGeometry, VisualPlayback } from '@active-book/types';

import type { BookGeometry } from '@components/BookVisualRoot/geometry';

import { resolvePlacement } from '@components/VisualSurfaces/utils/placement';

import type { VisualEffects } from '@@/visualEffects';

type RegisteredVisualEffectProps = {
  effect: VisualEffectInstance;
  visualEffects: VisualEffects;
  geometry: BookGeometry | null;
};

export const RegisteredVisualEffect = memo(({ effect, visualEffects, geometry }: RegisteredVisualEffectProps) => {
  const { id, definitionId, params } = effect;

  const { Renderer, defaultParams } = visualEffects.getDefinition(definitionId);

  const playbackRef = useRef<VisualPlayback | null>(null);

  const previousGeometry = useRef<VisualGeometry>({
    width: 0,
    height: 0,
  });

  const bounds = geometry ? resolvePlacement(effect.placement, geometry) : null;

  const width = bounds?.width ?? previousGeometry.current.width;
  const height = bounds?.height ?? previousGeometry.current.height;

  const rendererGeometry = useMemo(() => ({
    width,
    height,
  }), [width, height]);

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
  return useMemo(() => (
    <Renderer
      id={id}
      params={resolvedParams}
      geometry={rendererGeometry}
      ref={playbackRef}
    />
  ), [id, resolvedParams, rendererGeometry, Renderer]);
});
