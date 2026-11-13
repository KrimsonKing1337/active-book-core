import { useLayoutEffect, useState } from 'react';

import { nanoid } from '@reduxjs/toolkit';

import { useDispatch, useSelector } from '@store';

import { mainSelectors } from '@store/main';
import { windowsActions } from '@store/windows';

import { useAppMode } from '@components/App/AppModeContext';

import { useReaderWindowHistory } from '../history';

export const useStoryWindowSession = () => {
  const dispatch = useDispatch();

  const appMode = useAppMode();

  const [sessionId] = useState(nanoid);

  const pageId = useSelector(mainSelectors.pageId);

  useLayoutEffect(() => {
    if (appMode === 'reader') {
      dispatch(windowsActions.synchronizeSession({ sessionId, pageId }));
    }
  }, [sessionId, pageId, appMode, dispatch]);

  let readerSessionId: string | null = null;

  if (appMode === 'reader') {
    readerSessionId = sessionId;
  }

  useReaderWindowHistory(readerSessionId);

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
