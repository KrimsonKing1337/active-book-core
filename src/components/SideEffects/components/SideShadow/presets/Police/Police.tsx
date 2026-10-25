import { useRef } from 'react';

import type { SideShadowItem } from 'hooks/effects/side/@types';

import { AnimatedSideShadow } from '../../AnimatedSideShadow';

import { useColorPolice } from './hooks';

import * as styles from './Police.module.scss';

type PoliceProps = {
  options: SideShadowItem;
};

export const Police = ({ options }: PoliceProps) => {
  const shadowRef = useRef<HTMLDivElement>(null);

  useColorPolice(shadowRef);

  return (
    <AnimatedSideShadow
      elementRef={shadowRef}
      options={options}
      className={styles.Police}
    />
  );
};
