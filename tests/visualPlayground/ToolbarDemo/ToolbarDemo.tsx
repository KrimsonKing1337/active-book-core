import type { CSSProperties } from 'react';

import type { VisualRendererProps } from '@active-book/types';

import classNames from 'classnames';

import { useAnimationPlayback } from '../hooks/useAnimationPlayback';
import { numberParam, stringParam } from '../utils';

import * as styles from './ToolbarDemo.module.scss';

export const ToolbarDemo = (props: VisualRendererProps) => {
  const {
    token,
    playing,
    status,
  } = useAnimationPlayback(props, () => ({ animations: [] }));
  const frame = props.id === 'toolbar-frame';
  const className = classNames({ [styles.Glow]: frame, [styles.Content]: !frame });
  const intensity = numberParam(props.params, 'intensity', 0.85);
  const style: CSSProperties = {
    color: stringParam(props.params, 'color', '#b59cff'),
    opacity: numberParam(props.params, 'opacity', 1) * intensity * (frame ? 1 : 0.45),
    animationPlayState: playing ? 'running' : 'paused',
  };

  return <div
    className={className}
    style={style}
    data-demo-effect={props.id}
    data-token={token}
    data-run-status={status}
  />;
};
