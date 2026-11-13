import {
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';

import type { RootState } from '@store';
import type { WindowTarget } from '@store/windows';


import {
  useDispatch,
  useSelector,
  useStore,
} from '@store';
import { windowsActions, windowsSelectors } from '@store/windows';

import { useStoryRegions } from '@components/StoryRegionsProvider';

import { StoryWindowSessionContext } from '../context';
import { matchesWindowTarget } from '../utils';

export const useStoryWindowDialog = (target: WindowTarget | undefined) => {
  const store = useStore();
  const dispatch = useDispatch();
  const sessionId = useContext(StoryWindowSessionContext);
  const { elements } = useStoryRegions();
  const fallbackFocusRef = useRef<HTMLElement | null>(null);
  fallbackFocusRef.current = elements.storyViewport ?? null;

  const isOpen = useSelector((state: RootState) => matchesWindowTarget(state, target));
  const active = useSelector(windowsSelectors.activeWindow);
  const targetSessionId = target?.sessionId;
  const instanceId = target?.instanceId;
  const isMountedRef = useRef(false);

  useLayoutEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // React replays cleanup/setup in StrictMode while the owner remains mounted.
      // Release only after that synchronous replay, with the original identity still bound.
      queueMicrotask(() => {
        if (!isMountedRef.current && targetSessionId && instanceId) {
          dispatch(windowsActions.forceClose({ sessionId: targetSessionId, instanceId }));
        }
      });
    };
  }, [targetSessionId, instanceId, dispatch]);

  const isCurrentWindow = useCallback(() => {
    if (!targetSessionId || !instanceId) {
      return false;
    }

    return matchesWindowTarget(store.getState(), { sessionId: targetSessionId, instanceId });
  }, [targetSessionId, instanceId, store]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && target) {
      dispatch(windowsActions.requestClose(target));
    }
  };

  const handleCloseAutoFocus = (event: Event) => {
    const { windows } = store.getState();

    if (windows.sessionId !== sessionId || windows.activeWindow) {
      event.preventDefault();
    }
  };

  return {
    isCurrentWindow,
    dialogProps: {
      isOpen,
      canClose: isOpen && active?.canClose === true,
      container: elements.storyViewport ?? null,
      fallbackFocusRef,
      onOpenChange: handleOpenChange,
      onCloseAutoFocus: handleCloseAutoFocus,
    },
  };
};
