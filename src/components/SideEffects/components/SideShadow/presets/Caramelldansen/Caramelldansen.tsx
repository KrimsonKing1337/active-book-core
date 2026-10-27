import { useRef } from 'react';

import type { SideShadowItem } from '@hooks/effects/side/@types';

import { SideShadow } from '../../SideShadow';

import { useColorCarameldansen } from './hooks';

import * as styles from './Caramelldansen.module.scss';

type CaramelldansenProps = {
  options: SideShadowItem;
};

export const Caramelldansen = ({ options }: CaramelldansenProps) => {
  const shadowRef = useRef<HTMLDivElement>(null);

  useColorCarameldansen(shadowRef);

  return (
    <SideShadow
      elementRef={shadowRef}
      options={options}
      className={styles.Caramelldansen}
    />
  );
};
