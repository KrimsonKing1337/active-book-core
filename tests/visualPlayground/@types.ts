import type { AnchorPoint, VisualRegion } from '@active-book/types';

export type Demo =
  | 'frame' | 'darkness' | 'edges' | 'smoke' | 'through'
  | 'collapse' | 'sequence' | 'single' | 'ball' | 'advancing' | 'toolbar';

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
  mask: boolean;
  plane: 'background' | 'belowNarrative' | 'aboveNarrative' | 'aboveStoryControls';
  frameAnchor: AnchorPoint;
  framePreset: 'pulse' | 'police' | 'caramel';
  offsetX: number;
  composition: 'single' | 'multiple';
  trigger: 'manual' | 'page';
  loop: boolean;
};

export const initialSettings: Settings = {
  demo: 'frame',
  region: 'storyViewportFrame',
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
  mask: false,
  plane: 'aboveNarrative',
  frameAnchor: 'top-left',
  framePreset: 'pulse',
  offsetX: 0,
  composition: 'single',
  trigger: 'manual',
  loop: false,
};
