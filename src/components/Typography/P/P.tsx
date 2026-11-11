import type { HTMLAttributes, PropsWithChildren } from 'react';

import * as styles from './P.module.scss';

export type PProps = HTMLAttributes<HTMLParagraphElement> & PropsWithChildren;

export const P = ({
  children,
  ...etc
}: PProps) => {
  return (
    <p className={styles.P} {...etc}>
      {children}
    </p>
  );
};
