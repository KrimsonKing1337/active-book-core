import type { PropsWithChildren } from 'react';

import classNames from 'classnames';

import * as styles from './Item.module.scss';

export type ItemProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

export const Item = ({
  children,
  className,
  onClick,
  onKeyDown,
  ...etc
}: PropsWithChildren<ItemProps>) => {
  const itemClassNames = classNames([
    styles.Item,
    className,
  ]);

  return (
    <div
      className={itemClassNames}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...etc}
      onClick={onClick}
      onKeyDown={(e) => {
        onKeyDown?.(e);

        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
    >
      {children}
    </div>
  );
};
