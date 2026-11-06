import { type PropsWithChildren, Suspense, useLayoutEffect } from 'react';

import classNames from 'classnames';

import { mainSelectors } from '@store/main';

import { useDispatch, useSelector } from '@store';
import { segmentsActions } from '@store/segments';

import * as styles from './StoryContent.module.scss';

/** Only the selected content and its resources belong to a page. */
export const StoryContent = ({ children }: PropsWithChildren) => {
  const dispatch = useDispatch();
  const pending = useSelector(mainSelectors.isPending);
  const showLoader = useSelector(mainSelectors.showLoader);
  const isLoading = pending || showLoader;
  const className = classNames(styles.Content, { [styles.Pending]: isLoading });

  useLayoutEffect(() => {
    return () => {
      dispatch(segmentsActions.reset());
    };
  }, [dispatch]);

  return (
    <div
      className={className}
      data-story-content
      aria-busy={isLoading}
      inert={isLoading}
    >
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </div>
  );
};
