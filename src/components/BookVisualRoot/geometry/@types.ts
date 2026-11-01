import type { VisualRegion } from '@active-book/types';

/** Axis-aligned measurements in CSS pixels, relative to the book's top-left corner. */
export type BookRegionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FrameInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type BookGeometry = {
  regions: Record<VisualRegion, BookRegionRect | null>;
  frameInsets: FrameInsets | null;
};
