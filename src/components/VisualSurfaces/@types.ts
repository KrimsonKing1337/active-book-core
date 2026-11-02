import type { CSSProperties, ReactNode } from 'react';

import type { VisualDepth, VisualEffectInstance } from '@active-book/types';

/** Controlled rendering input, not a registered effect or a saved book schema. */
export type VisualSurfaceItem = Pick<VisualEffectInstance, 'id' | 'placement' | 'visibility'> & {
  depth: VisualDepth | { plane: 'systemFeedback'; order: number };
  content: ReactNode;
};

export type VisibilityStyle = CSSProperties & {
  '--frame-top'?: string;
  '--frame-right'?: string;
  '--frame-bottom'?: string;
  '--frame-left'?: string;
};

export type ResolvedVisualSurface = {
  visibilityStyle: VisibilityStyle;
  surfaceStyle: CSSProperties;
};
