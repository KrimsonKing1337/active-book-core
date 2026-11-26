import {
  type PropsWithChildren,
  useContext,
  Suspense,
  useLayoutEffect,
} from 'react';

import classNames from 'classnames';


import { mainActions, mainSelectors } from '@store/main';

import {
  useDispatch,
  useSelector,
  useStore,
} from '@store';
import { segmentsActions } from '@store/segments';

import { BookPresentationContext, usePageVisit } from '@hooks/pagePresentation/context';

import { useAppMode } from '@components/App/AppModeContext';

import * as styles from './StoryContent.module.scss';

const PrimaryContent = ({ visitId, children }: PropsWithChildren<{
  visitId: number
}>) => {
  const dispatch = useDispatch();

  useLayoutEffect(() => {
    dispatch(mainActions.setPrimaryCommitted({ visitId, committed: true }));

    return () => {
      dispatch(mainActions.setPrimaryCommitted({ visitId, committed: false }));
    };
  }, [dispatch, visitId]);

  return children;
};

/** Only the selected content and its resources belong to a page. */
export const StoryContent = ({ children }: PropsWithChildren) => {
  const dispatch = useDispatch();

  const store = useStore();
  const appMode = useAppMode();
  const bookSession = useContext(BookPresentationContext);
  const visit = usePageVisit();
  const pending = useSelector(mainSelectors.isPending);
  const showLoader = useSelector(mainSelectors.showLoader);

  const visitId = visit?.id;
  const reveal = visit?.reveal ?? false;
  const isLoading = !!bookSession && (!reveal || showLoader);
  const hideContent = appMode === 'reader' && isLoading;

  useLayoutEffect(() => {
    if (visitId === undefined || pending || showLoader) {
      return;
    }

    if (!reveal) {
      // Let all layout registrations, including synchronous portal commits, settle first.
      let cancelled = false;

      queueMicrotask(() => {
        if (!cancelled) {
          dispatch(mainActions.allowPageReveal(visitId));
        }
      });

      return () => {
        cancelled = true;
      };
    }

    if (mainSelectors.presentedAt(store.getState()) === null) {
      dispatch(mainActions.presentPage({ visitId, time: performance.now() }));
    }
  }, [
    dispatch,
    store,
    visitId,
    pending,
    showLoader,
    reveal,
  ]);

  const className = classNames({
    [styles.Content]: true,
    [styles.Pending]: hideContent,
  });

  useLayoutEffect(() => {
    return () => {
      dispatch(segmentsActions.reset());
    };
  }, [dispatch, visitId]);

  return (
    <div
      className={className}
      data-story-content
      data-story-preparing={isLoading || undefined}
      aria-busy={isLoading}
      inert={hideContent}
    >
      <Suspense fallback={null}>
        {!bookSession && children}

        {visitId !== undefined && (
          <PrimaryContent visitId={visitId} key={visitId}>
            {children}
          </PrimaryContent>
        )}
      </Suspense>
    </div>
  );
};
