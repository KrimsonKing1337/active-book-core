import type { PropsWithChildren } from 'react';

import classNames from 'classnames';

import * as styles from './Wrapper.module.scss';

export type WrapperProps = React.HTMLAttributes<HTMLDivElement> & PropsWithChildren & {
  className?: string;
};

export const Wrapper = ({ children, id = '', className = '', ...etc }: WrapperProps) => {
  const wrapperClassNames = classNames({
    [styles.Wrapper]: true,
    [className]: !!className,
  });

  return (
    <div id={id} className={wrapperClassNames} {...etc}>
      {children}
    </div>
  );
};
