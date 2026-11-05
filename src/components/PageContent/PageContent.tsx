import { type PropsWithChildren, Suspense, useLayoutEffect } from 'react';

import { useDispatch } from '@store';
import { segmentsActions } from '@store/segments';

/** Only the selected content and its resources belong to a page. */
export const PageContent = ({ children }: PropsWithChildren) => {
  const dispatch = useDispatch();

  useLayoutEffect(() => {
    return () => {
      dispatch(segmentsActions.reset());
    };
  }, [dispatch]);

  return <Suspense fallback={null}>{children}</Suspense>;
};
