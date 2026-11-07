import type { VisualEffectLifetime } from '@active-book/types';

import type { FrameEffect } from '@hooks/effects/frame/@types';
import { useFrameEffect } from '@hooks/effects/frame';

export type FrameProps = FrameEffect & {
  lifetime?: VisualEffectLifetime;
};

export const Frame = ({
  lifetime,
  ...props
}: FrameProps) => {
  useFrameEffect(props, lifetime);

  return null;
};
