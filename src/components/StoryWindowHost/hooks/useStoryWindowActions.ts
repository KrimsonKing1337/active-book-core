import { useContext } from 'react';

import { useDispatch, useSelector } from '@store';

import { mainSelectors } from '@store/main';
import { type OpenWindowOptions, windowsActions } from '@store/windows';

import { StoryWindowSessionContext } from '../context';

type OpenOptions = Omit<OpenWindowOptions, 'sessionId' | 'pageId'>;

export const useStoryWindowActions = () => {
  const dispatch = useDispatch();

  const pageId = useSelector(mainSelectors.pageId);

  const sessionId = useContext(StoryWindowSessionContext);

  if (!sessionId) {
    throw new Error('Story window actions require a reader BookSession');
  }

  const open = (options: OpenOptions) => {
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
