import type { ReactNode } from 'react';

import type { VisualDepth, VisualEffectInstance } from '@active-book/types';

export type SystemFeedbackDepth = {
  plane: 'systemFeedback';
  order: number;
};

export type VisualSurfaceDepth = VisualDepth | SystemFeedbackDepth;

/** Controlled input uses exactly the same local placement contract as registered instances. */
export type VisualSurfaceItem = Pick<VisualEffectInstance, 'id' | 'placement' | 'visibility'> & {
  depth: VisualSurfaceDepth;
  content: ReactNode;
  hidden?: boolean;
};
