import type { CSSProperties } from 'react';

import { useLayoutEffect, useMemo, useRef } from 'react';

import type { VisualRendererProps } from '@active-book/types';


import { useStoryRegions } from '@components/StoryRegionsProvider';

import { useAnimationPlayback } from '../hooks/useAnimationPlayback';
import { useRelativeOrigin } from '../hooks/useRelativeOrigin';
import { numberParam, stringParam } from '../utils';

import * as styles from './Darkness.module.scss';

export const Darkness = (props: VisualRendererProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const { elements } = useStoryRegions();
  const { params, id } = props;
  const direction = stringParam(params, 'direction', 'grow');
  const origin = useRelativeOrigin({
    source: elements.narrativeFrame,
    target: nodeRef,
    x: numberParam(params, 'originX', 50) / 100,
    y: numberParam(params, 'originY', 50) / 100,
  });
  const edges = params.edges === true;
  const center = `${origin.x}px ${origin.y}px`;
  const full = `circle(${origin.radius}px at ${center})`;
  const empty = `circle(0px at ${center})`;
  const keyframes = useMemo<Keyframe[]>(() => {
    if (direction === 'shrink') {
      return [{ clipPath: full }, { clipPath: empty }];
    }

    if (direction === 'reveal') {
      return [{ '--lab-hole': '0px' }, { '--lab-hole': `${origin.radius + 1}px` }];
    }

    if (edges) {
      return [{ '--lab-edge': '100%' }, { '--lab-edge': '-60%' }];
    }

    return [{ clipPath: empty }, { clipPath: full }];
  }, [full, empty, origin.radius, direction, edges]);

  const {
    token,
    active,
    status,
  } = useAnimationPlayback(props, () => {
    const node = nodeRef.current;

    if (!node) {
      throw new Error('Darkness surface is not attached');
    }

    const animation = node.animate(keyframes, {
      duration: numberParam(params, 'duration', 2000),
      fill: 'both',
      easing: 'linear',
    });
    animationRef.current = animation;

    return { animations: [animation] };
  });

  useLayoutEffect(() => {
    const effect = animationRef.current?.effect;

    if (effect instanceof KeyframeEffect) {
      effect.setKeyframes(keyframes);
    }
  }, [keyframes]);

  let maskImage: string | undefined;

  if (direction === 'reveal') {
    maskImage = `radial-gradient(circle at ${center}, transparent var(--lab-hole), black calc(var(--lab-hole) + 1px))`;
  } else if (edges) {
    maskImage = 'radial-gradient(ellipse closest-side, transparent var(--lab-edge), black calc(var(--lab-edge) + 1%))';
  }

  const style: CSSProperties = {
    backgroundColor: stringParam(params, 'color', '#11131f'),
    opacity: numberParam(params, 'intensity', 1) * numberParam(params, 'opacity', 1),
    maskImage,
    visibility: active ? 'visible' : 'hidden',
  };

  return (
    <div
      ref={nodeRef}
      className={styles.Darkness}
      style={style}
      data-demo-effect={id}
      data-token={token}
      data-run-status={status}
    />
  );
};
