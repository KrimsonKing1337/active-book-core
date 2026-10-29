import type { CSSProperties, ReactNode } from 'react';

export type FrameSide = 'top' | 'right' | 'bottom' | 'left';

export type FrameMask = {
  enabled: boolean;
  sides: FrameSide[];
};

export type SidePosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export type SideAnimationPreset =
  | 'none'
  | 'pulse'
  | 'police'
  | 'caramel'
  | 'scroll';

export type SideAnimation = {
  preset?: SideAnimationPreset;
  duration?: number;
  delay?: number;
  iterations?: number | 'infinite';
  playState?: 'running' | 'paused' | 'stopped';
};

export type SideElementLayout = {
  position?: SidePosition;
  offsetX?: string;
  offsetY?: string;
  style?: CSSProperties;
  hidden?: boolean;
};

export type SideShadowItem = SideElementLayout & {
  id: string;
  sides: FrameSide[];
  thickness?: number;
  animation?: SideAnimation;
};

export type SideTextItem = SideElementLayout & {
  id: string;
  leftText: string;
  rightText: string;
  animation?: SideAnimation;
};

export type SideEffect = {
  id: string;
  kind: 'shadow' | 'text' | 'component';
  shadow?: SideShadowItem;
  text?: SideTextItem;
  Component?: ReactNode;
  frameMask?: FrameMask;
  style?: CSSProperties;
};
