import type { HTMLAttributes, Ref } from 'react';

import classNames from 'classnames';

import * as styles from './BookVisualRoot.module.scss';

export type BookVisualRootProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
};

export const BookVisualRoot = ({ children, className, ref, ...etc }: BookVisualRootProps) => {
  const rootClassNames = classNames(styles.BookVisualRoot, className);

  return (
    <div
      {...etc}
      ref={ref}
      className={rootClassNames}
      data-book-region="book"
    >
      {children}
    </div>
  );
};
