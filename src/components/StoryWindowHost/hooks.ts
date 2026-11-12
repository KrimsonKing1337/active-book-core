import {
  useContext,
  useLayoutEffect,
  useState,
} from 'react';

import { nanoid } from '@reduxjs/toolkit';

import { useDispatch, useSelector } from '@store';
import { mainSelectors } from '@store/main';
import type { OpenWindowOptions } from '@store/windows';
import { windowsActions } from '@store/windows';

import { useAppMode } from '@components/App/AppModeContext';

import { StoryWindowSessionContext } from './context';

export const useStoryWindowSession = () => {
  const [sessionId] = useState(nanoid);
  const dispatch = useDispatch();
  const pageId = useSelector(mainSelectors.pageId);
  const appMode = useAppMode();

  useLayoutEffect(() => {
    if (appMode === 'reader') {
      dispatch(windowsActions.synchronizeSession({ sessionId, pageId }));
    }
  }, [sessionId, pageId, appMode, dispatch]);

  useLayoutEffect(() => {
    if (appMode !== 'reader') {
      return;
    }

    return () => {
      dispatch(windowsActions.endSession(sessionId));
    };
  }, [sessionId, appMode, dispatch]);

  if (appMode !== 'reader') {
    return null;
  }

  return sessionId;
};

export const useStoryWindowActions = () => {
  const sessionId = useContext(StoryWindowSessionContext);
  const pageId = useSelector(mainSelectors.pageId);
  const dispatch = useDispatch();

  if (!sessionId) {
    throw new Error('Story window actions require a reader BookSession');
  }

  const open = (options: Omit<OpenWindowOptions, 'sessionId' | 'pageId'>) => {
    const action = windowsActions.open({
      ...options,
      sessionId,
      pageId,
    });

    dispatch(action);

    return action.payload.instanceId;
  };

  const requestClose = (instanceId: string) => {
    dispatch(windowsActions.requestClose({ sessionId, instanceId }));
  };

  const forceClose = (instanceId: string) => {
    dispatch(windowsActions.forceClose({ sessionId, instanceId }));
  };

  return {
    open,
    requestClose,
    forceClose,
  };
};
