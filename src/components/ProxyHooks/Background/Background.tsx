import type { VisualEffectLifetime } from '@active-book/types';

import type { BackgroundEffect } from '@hooks/effects/background/@types';
import { useBackground } from '@hooks/effects/background';

export type BackgroundProps = BackgroundEffect & {
  lifetime?: VisualEffectLifetime;
};

export const Background = ({
  lifetime,
  ...props
}: BackgroundProps) => {
  useBackground(props, lifetime);

  return null;
};
