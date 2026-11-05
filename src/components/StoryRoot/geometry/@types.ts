import type { VisualRegion } from '@active-book/types';

/** Axis-aligned measurements in CSS pixels, relative to the story's top-left corner. */
export type StoryRegionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: string;
};

export type FrameInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type StoryGeometry = {
  regions: Record<VisualRegion, StoryRegionRect | null>;
  frameInsets: FrameInsets | null;
};
