import type { PropsWithChildren } from 'react';

import type { AppWrapperProps } from './@types';
import { BookSession } from './components/BookSession';

export type { AppWrapperProps } from './@types';

export const AppWrapper = ({ bookKey, ...props }: PropsWithChildren<AppWrapperProps>) => {
  return <BookSession key={bookKey} {...props} />;
};
