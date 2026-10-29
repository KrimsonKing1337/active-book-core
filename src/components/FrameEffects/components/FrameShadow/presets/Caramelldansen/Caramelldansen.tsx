import { useRef } from 'react';

import type { FrameShadowItem } from '@hooks/effects/frame/@types';

import { FrameShadow } from '../../FrameShadow';

import { useColorCarameldansen } from './hooks';

import * as styles from './Caramelldansen.module.scss';

type CaramelldansenProps = {
  options: FrameShadowItem;
};

export const Caramelldansen = ({ options }: CaramelldansenProps) => {
  const shadowRef = useRef<HTMLDivElement>(null);

  useColorCarameldansen(shadowRef);

  return (
    <FrameShadow
      elementRef={shadowRef}
      options={options}
      className={styles.Caramelldansen}
    />
  );
};
