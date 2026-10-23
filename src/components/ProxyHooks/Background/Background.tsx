import type { BackgroundEffect } from 'hooks/effects/background/@types';

import { useBackground } from 'hooks/effects/background';

export type BackgroundProps = BackgroundEffect;

export const Background = (props: BackgroundProps) => {
  useBackground(props);

  return null;
};
