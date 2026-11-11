import type { HTMLAttributes, PropsWithChildren } from 'react';

import * as styles from './H2.module.scss';

export type H2Props = HTMLAttributes<HTMLHeadingElement> & PropsWithChildren;

export const H2 = ({
  children,
  ...etc
}: H2Props) => {
  return (
    <h2 className={styles.H2} {...etc}>
      {children}
    </h2>
  );
};
