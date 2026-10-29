import { useRef } from 'react';

import type { FrameShadowItem } from '@hooks/effects/frame/@types';

import { FrameShadow } from '../../FrameShadow';

import { useColorPolice } from './hooks';

import * as styles from './Police.module.scss';

type PoliceProps = {
  options: FrameShadowItem;
};

export const Police = ({ options }: PoliceProps) => {
  const shadowRef = useRef<HTMLDivElement>(null);

  useColorPolice(shadowRef);

  return (
    <FrameShadow
      elementRef={shadowRef}
      options={options}
      className={styles.Police}
    />
  );
};
