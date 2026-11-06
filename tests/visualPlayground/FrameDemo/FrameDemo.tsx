import type { VisualRendererProps } from '@active-book/types';

import { FrameRenderer } from '@components/FrameEffects/components/FrameRenderer';

import { useAnimationPlayback } from '../hooks/useAnimationPlayback';
import { numberParam, stringParam } from '../utils';

import * as styles from './FrameDemo.module.scss';

export const FrameDemo = (props: VisualRendererProps) => {
  const {
    status,
    token,
    playing,
    active,
  } = useAnimationPlayback(props, () => ({ animations: [] }));
  const duration = numberParam(props.params, 'duration', 2000);
  const color = stringParam(props.params, 'color', '#70d9c5');
  const position = stringParam(props.params, 'frameAnchor', 'top-left');
  const offsetX = `${numberParam(props.params, 'offsetX', 0)}px`;
  const playState = playing ? 'running' : 'paused';
  const animation = {
    preset: active ? stringParam(props.params, 'framePreset', 'pulse') : 'none', duration, playState,
  };
  const shadowParams = {
    kind: 'shadow',
    shadow: {
      id: 'playground-shadow',
      sides: ['top', 'right', 'bottom', 'left'],
      thickness: 45,
      position,
      offsetX,
      style: { color, opacity: numberParam(props.params, 'intensity', 0.8) },
      animation,
    },
  };
  const textParams = {
    kind: 'text',
    text: {
      id: 'playground-text',
      leftText: '✦ ПАМЯТЬ МОРЯ ✦',
      rightText: '✦ СЛЕДУЙТЕ ЗА СВЕТОМ ✦',
      position,
      offsetX,
      style: { color: '#f5deb1' },
      animation: {
        preset: active ? 'scroll' : 'none', duration: duration * 4, playState,
      },
    },
  };

  return (
    <div
      className={styles.Frame}
      style={{ opacity: numberParam(props.params, 'opacity', 1) }}
      data-demo-effect={props.id}
      data-token={token}
      data-run-status={status}
    >
      <FrameRenderer {...props} params={shadowParams} />
      <FrameRenderer {...props} id={`${props.id}-text`} params={textParams} />
    </div>
  );
};
