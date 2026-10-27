import type { SideEffect } from '@hooks/effects/side/@types';

import { useSideEffect } from '@hooks/effects/side/useSideEffect';

export type SideProps = SideEffect;

export const Side = (props: SideProps) => {
  useSideEffect(props);

  return null;
};
