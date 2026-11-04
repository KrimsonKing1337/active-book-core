import type { VisualSurfaceItem } from '@components';

export type SurfaceSpec = Omit<VisualSurfaceItem, 'content'> & {
  background: string;
};

declare global {
  interface Window {
    setVisualTestSelection: (id: string | null) => void;
    setVisualTestSurfaces: (items: SurfaceSpec[]) => void;
  }
}
