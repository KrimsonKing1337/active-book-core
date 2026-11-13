import {
  Fragment,
  useContext,
  useRef,
} from 'react';

import {
  useDispatch,
  useSelector,
  useStore,
} from '@store';

import { windowsActions, windowsSelectors } from '@store/windows';
import { mainSelectors } from '@store/main';

import { StoryDialog } from '@components';
import { useStoryRegions } from '@components/StoryRegionsProvider';

import type { StoryWindowHostProps } from './@types';

import { StoryWindowSessionContext } from './context';

export const StoryWindowHost = ({ resolveContent }: StoryWindowHostProps) => {
  const dispatch = useDispatch();
  const store = useStore();

  const sessionId = useContext(StoryWindowSessionContext);

  const active = useSelector(windowsSelectors.activeWindow);
  const ownerId = useSelector(windowsSelectors.sessionId);
  const windowPageId = useSelector(windowsSelectors.pageId);
  const pageId = useSelector(mainSelectors.pageId);

  const { elements } = useStoryRegions();

  const fallbackFocusRef = useRef<HTMLElement | null>(null);
  fallbackFocusRef.current = elements.storyViewport ?? null;

  const isCurrentSession = sessionId !== null && ownerId === sessionId;
  const isCurrentPage = pageId === windowPageId;
  const isMatchingWindow = active?.kind === 'content';

  if (!isCurrentSession || !isCurrentPage || !isMatchingWindow) {
    return null;
  }

  const {
    instanceId,
    contentId,
    canClose,
  } = active;

  const { children, ...contentProps } = resolveContent(contentId);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      dispatch(windowsActions.requestClose({ sessionId, instanceId }));
    }
  };

  const handleCloseAutoFocus = (e: Event) => {
    const state = store.getState();

    const current = windowsSelectors.activeWindow(state);
    const currentOwnerId = windowsSelectors.sessionId(state);

    if (currentOwnerId !== sessionId || current) {
      e.preventDefault();
    }
  };

  return (
    <StoryDialog
      {...contentProps}
      isOpen
      canClose={canClose}
      container={elements.storyViewport ?? null}
      fallbackFocusRef={fallbackFocusRef}
      onOpenChange={handleOpenChange}
      onCloseAutoFocus={handleCloseAutoFocus}
    >
      <Fragment key={instanceId}>
        {children}
      </Fragment>
    </StoryDialog>
  );
};
