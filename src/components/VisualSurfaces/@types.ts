import type { CSSProperties, ReactNode } from 'react';

import type { VisualDepth, VisualEffectInstance } from '@active-book/types';

/** Controlled rendering input, not a registered effect or a saved book schema. */
export type VisualSurfaceDepth = VisualDepth | SystemFeedbackDepth;

export type SystemFeedbackDepth = {
  plane: 'systemFeedback';
  order: number;
};

export type VisualSurfaceItem = Pick<VisualEffectInstance, 'id' | 'placement' | 'visibility'> & {
  depth: VisualSurfaceDepth;
  content: ReactNode;
  hidden?: boolean;
  /** Experimental host metadata, never inferred from an author's layer order. */
  host?: 'story' | 'underStory' | 'aboveStory';
  layout?: 'geometry' | 'css' | 'hybrid';
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
