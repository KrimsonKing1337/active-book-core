import {
  type PropsWithChildren,
  useContext,
  Suspense,
  useLayoutEffect,
} from 'react';

import classNames from 'classnames';

import {
  useDispatch,
  useSelector,
  useStore,
} from '@store';

import { mainActions, mainSelectors } from '@store/main';
import { segmentsActions } from '@store/segments';

import { BookPresentationContext, usePageVisit } from '@hooks/pagePresentation/context';

import { useAppMode } from '@components/App/AppModeContext';

import * as styles from './StoryContent.module.scss';

export type PrimaryContentProps = PropsWithChildren & {
  visitId: number;
};

const PrimaryContent = ({ visitId, children }: PrimaryContentProps) => {
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
  const store = useStore();
  const dispatch = useDispatch();

  const bookSession = useContext(BookPresentationContext);

  const appMode = useAppMode();
  const visit = usePageVisit();

  const pending = useSelector(mainSelectors.isPending);
  const showLoader = useSelector(mainSelectors.showLoader);

  const visitId = visit?.id;
  const reveal = visit?.reveal ?? false;
  const pageNotReady = !reveal || showLoader;
  const isLoading = !!bookSession && pageNotReady;
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

    const state = store.getState();
    const presentedAt = mainSelectors.presentedAt(state);

    if (presentedAt === null) {
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

  const dataStoryPreparing = isLoading || undefined;

  return (
    <div
      className={className}
      data-story-content
      data-story-preparing={dataStoryPreparing}
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
