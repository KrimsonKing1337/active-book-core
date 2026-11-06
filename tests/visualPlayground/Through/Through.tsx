import type { CSSProperties } from 'react';

import { useRef } from 'react';

import type { VisualRendererProps } from '@active-book/types';


import { useStoryRegions } from '@components/StoryRegionsProvider';

import { startCssAnimation } from '../hooks/startCssAnimation';

import { useAnimationPlayback } from '../hooks/useAnimationPlayback';
import { useRelativeOrigin } from '../hooks/useRelativeOrigin';
import { numberParam, stringParam } from '../utils';

import * as styles from './Through.module.scss';

export const Through = (props: VisualRendererProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const { elements } = useStoryRegions();
  const origin = useRelativeOrigin({
    source: elements.narrativeFrame, target: nodeRef, y: 1,
  });
  const { token } = useAnimationPlayback(props, () => {
    const wave = waveRef.current;

    if (!wave) {
      throw new Error('Wave is not attached');
    }

    const effect = startCssAnimation({
      node: wave, className: styles.Propagation, duration: numberParam(props.params, 'duration', 2000),
    });

    return { animations: [effect.animation], cleanup: effect.cleanup };
  });
  const style: CSSProperties = {
    color: stringParam(props.params, 'color', '#75e1d5'),
    opacity: numberParam(props.params, 'intensity', 0.85) * numberParam(props.params, 'opacity', 1),
  };
  const waveStyle = {
    left: origin.x,
    top: origin.y,
    width: origin.radius * 2,
    height: origin.radius * 2,
  };

  return (
    <div
      ref={nodeRef}
      className={styles.Through}
      style={style}
      data-demo-effect={props.id}
      data-token={token}
    >
      <div ref={waveRef} className={styles.Wave} style={waveStyle} />
    </div>
  );
};
