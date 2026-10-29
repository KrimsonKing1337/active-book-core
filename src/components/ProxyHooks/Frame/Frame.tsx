import type { FrameEffect } from '@hooks/effects/frame/@types';

import { useFrameEffect } from '@hooks/effects/frame/useFrameEffect';

export type FrameProps = FrameEffect;

export const Frame = (props: FrameProps) => {
  useFrameEffect(props);

  return null;
};
