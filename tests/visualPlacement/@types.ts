import type { VisualSurfaceItem } from '@components';

export type SurfaceSpec = Omit<VisualSurfaceItem, 'content'> & {
  background: string;
};

declare global {
  interface Window {
    setVisualTestSurfaces: (items: SurfaceSpec[]) => void;
  }
}
