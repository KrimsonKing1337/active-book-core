import type { AnchorPoint, VisualRegion } from '@active-book/types';

export type Demo =
  | 'frame' | 'darkness' | 'edges' | 'smoke' | 'through'
  | 'collapse' | 'sequence' | 'single' | 'ball' | 'advancing';

export type Settings = {
  demo: Demo;
  region: VisualRegion;
  duration: number;
  intensity: number;
  opacity: number;
  speed: number;
  color: string;
  direction: 'grow' | 'shrink' | 'reveal';
  originX: number;
  originY: number;
  width: number;
  height: number;
  storySize: number;
  toolbar: boolean;
  toolbarHeight: number;
  mask: boolean;
  plane: 'belowNarrative' | 'aboveNarrative';
  frameAnchor: AnchorPoint;
  offsetX: number;
  composition: 'single' | 'multiple';
  trigger: 'manual' | 'page';
  loop: boolean;
};

export const initialSettings: Settings = {
  demo: 'frame',
  region: 'storyViewport',
  duration: 2000,
  intensity: 0.85,
  opacity: 1,
  speed: 1,
  color: '#70d9c5',
  direction: 'grow',
  originX: 50,
  originY: 50,
  width: 1040,
  height: 690,
  storySize: 100,
  toolbar: true,
  toolbarHeight: 48,
  mask: false,
  plane: 'aboveNarrative',
  frameAnchor: 'top-left',
  offsetX: 0,
  composition: 'single',
  trigger: 'manual',
  loop: false,
};
