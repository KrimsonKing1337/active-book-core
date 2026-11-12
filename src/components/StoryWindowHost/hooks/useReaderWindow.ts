import { useContext } from 'react';

import type { WindowKind, WindowTarget } from '@store/windows';

import { useDispatch, useSelector } from '@store';
import { mainSelectors } from '@store/main';
import { windowsActions, windowsSelectors } from '@store/windows';

import { StoryWindowSessionContext } from '../context';

type ReaderWindowOptions = {
  kind: Exclude<WindowKind, 'content'>;
  contentId?: string;
  canClose?: boolean;
};

// Specialized reader shells share ownership and opening commands, not a content registry.
// A missing reader context (editor preview) makes these commands inert.
export const useReaderWindow = ({
  kind,
  contentId = kind,
  canClose = true,
}: ReaderWindowOptions) => {
  const dispatch = useDispatch();
  const sessionId = useContext(StoryWindowSessionContext);
  const ownerId = useSelector(windowsSelectors.sessionId);
  const pageId = useSelector(mainSelectors.pageId);
  const windowPageId = useSelector(windowsSelectors.pageId);
  const active = useSelector(windowsSelectors.activeWindow);
  let target: WindowTarget | undefined;

  if (sessionId && ownerId === sessionId && pageId === windowPageId &&
      active?.kind === kind && active.contentId === contentId) {
    target = { sessionId, instanceId: active.instanceId };
  }

  const open = () => {
    if (sessionId) {
      dispatch(windowsActions.open({
        sessionId,
        pageId,
        kind,
        contentId,
        canClose,
      }));
    }
  };

  const close = () => {
    if (target) {
      dispatch(windowsActions.requestClose(target));
    }
  };

  const forceClose = () => {
    if (target) {
      dispatch(windowsActions.forceClose(target));
    }
  };

  const setIsOpen = (isOpen: boolean) => {
    if (isOpen) {
      open();
    } else {
      close();
    }
  };

  return {
    isOpen: !!target,
    target,
    open,
    close,
    forceClose,
    setIsOpen,
  };
};
