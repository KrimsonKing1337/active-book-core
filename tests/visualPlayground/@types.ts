import type { VisualRegion } from '@active-book/types';

export type Demo = 'frame' | 'darkness' | 'edges' | 'smoke' | 'through' | 'collapse' | 'sequence' | 'single';
export type Layout = 'geometry' | 'css' | 'hybrid';

export type Settings = {
  demo: Demo;
  layout: Layout;
  region: Extract<VisualRegion, 'storyViewport' | 'narrativeFrame' | 'story' | 'application'>;
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
  frameAnchor: 'top-left' | 'center' | 'bottom';
  offsetX: number;
  customPlacement: boolean;
  independentAnchor: boolean;
  physicalMode: 'scale' | 'size';
  composition: 'single' | 'multiple';
  trigger: 'manual' | 'page';
};

export const initialSettings: Settings = {
  demo: 'frame',
  layout: 'geometry',
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
  customPlacement: false,
  independentAnchor: false,
  physicalMode: 'scale',
  composition: 'single',
  trigger: 'manual',
};
