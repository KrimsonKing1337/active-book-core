import type { HTMLAttributes, PropsWithChildren } from 'react';

import * as styles from './H1.module.scss';

export type H1Props = HTMLAttributes<HTMLHeadingElement> & PropsWithChildren;

export const H1 = ({
  children,
  ...etc
}: H1Props) => {
  return (
    <h1 className={styles.H1} {...etc}>
      {children}
    </h1>
  );
};
