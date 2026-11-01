import type { VisualSurfaceItem } from '../../src/components/VisualSurfaces';

export type SurfaceSpec = Omit<VisualSurfaceItem, 'content'> & {
  background: string;
};

declare global {
  interface Window {
    setVisualTestSurfaces: (items: SurfaceSpec[]) => void;
  }
}
