import type { CSSProperties, ReactNode } from 'react';

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

export type SideAnimationPreset = 'none' | 'pulse' | 'police' | 'caramel' | 'scroll';

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
  scale?: number;
  style?: CSSProperties;
  hidden?: boolean;
};

export type SideShadowItem = SideElementLayout & {
  id: string;
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
  shadows?: SideShadowItem[];
  texts?: SideTextItem[];
  Component?: ReactNode;
};
