import type { CSSProperties } from 'react';

export type FrameSide = 'top' | 'right' | 'bottom' | 'left';

// The overlay layer is reserved for system feedback and is not author-editable.
export type FrameLayer = 'behind' | 'above' | 'overlay';

export type FrameMask = {
  enabled: boolean;
  sides: FrameSide[];
};

export type FramePosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export type FrameAnimationPreset =
  | 'none'
  | 'pulse'
  | 'police'
  | 'caramel'
  | 'scroll';

export type FrameAnimation = {
  preset?: FrameAnimationPreset;
  duration?: number;
  delay?: number;
  iterations?: number | 'infinite';
  playState?: 'running' | 'paused' | 'stopped';
};

export type FrameElementLayout = {
  position?: FramePosition;
  offsetX?: string;
  offsetY?: string;
  style?: CSSProperties;
  hidden?: boolean;
};

export type FrameShadowItem = FrameElementLayout & {
  id: string;
  sides: FrameSide[];
  thickness?: number;
  animation?: FrameAnimation;
};

export type FrameTextItem = FrameElementLayout & {
  id: string;
  leftText: string;
  rightText: string;
  animation?: FrameAnimation;
};

export type FrameEffect = {
  order?: number;
  id: string;
  kind: 'shadow' | 'text' | 'component';
  layer?: FrameLayer;
  shadow?: FrameShadowItem;
  text?: FrameTextItem;
  frameMask?: FrameMask;
  style?: CSSProperties;
};
