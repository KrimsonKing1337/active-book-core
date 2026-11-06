import { useLayoutEffect, useMemo, useRef } from 'react';

import type { VisualRendererProps } from '@active-book/types';


import { useStoryRegions } from '@components/StoryRegionsProvider';

import { startCssAnimation } from '../hooks/startCssAnimation';

import { useAnimationPlayback } from '../hooks/useAnimationPlayback';
import { useRelativeOrigin } from '../hooks/useRelativeOrigin';
import { numberParam, stringParam } from '../utils';

import * as styles from './SingleScene.module.scss';

export const SingleScene = (props: VisualRendererProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<Animation | null>(null);
  const { elements } = useStoryRegions();
  const origin = useRelativeOrigin({ source: elements.narrativeFrame, target: nodeRef });
  const keyframes = useMemo<Keyframe[]>(() => {
    const center = `${origin.x}px ${origin.y}px`;
    const full = `circle(${origin.radius}px at ${center})`;

    return [
      { clipPath: `circle(0px at ${center})`, opacity: 1 },
      {
        clipPath: full, opacity: 1, offset: 0.5,
      },
      {
        clipPath: full, opacity: 1, offset: 0.85,
      },
      { clipPath: full, opacity: 0 },
    ];
  }, [origin.x, origin.y, origin.radius]);

  useLayoutEffect(() => {
    const effect = shadeRef.current?.effect;

    if (effect instanceof KeyframeEffect) {
      effect.setKeyframes(keyframes);
    }
  }, [keyframes]);

  const { token } = useAnimationPlayback(props, () => {
    const node = nodeRef.current;
    const viewport = elements.storyViewport;

    if (!node || !viewport) {
      throw new Error('Scene is not attached');
    }

    const duration = numberParam(props.params, 'duration', 2000);
    const shade = node.animate(keyframes, {
      duration,
      fill: 'both',
    });
    shadeRef.current = shade;
    const shrink = startCssAnimation({
      node: viewport, className: styles.Shrink, duration, 
    });

    return { animations: [shade, shrink.animation], cleanup: shrink.cleanup };
  });
  const style = {
    color: stringParam(props.params, 'color', '#11131f'),
    opacity: numberParam(props.params, 'opacity', 1),
  };

  return (
    <div
      className={styles.Wrapper}
      style={style}
      data-demo-effect={props.id}
      data-token={token}
    >
      <div ref={nodeRef} className={styles.Scene} />
    </div>
  );
};
