import type { PropsWithChildren } from 'react';

import type { AppWrapperProps } from './@types';
import { BookSession } from './components';

export const AppWrapper = ({
  bookKey,
  ...props
}: PropsWithChildren<AppWrapperProps>) => {
  return (
    <BookSession key={bookKey ?? props.config.id} bookKey={bookKey} {...props} />
  );
};
