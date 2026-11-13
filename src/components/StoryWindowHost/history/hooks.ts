import { useLayoutEffect } from 'react';

import { useStore } from '@store';

import { connectWindowHistory } from './connect';

export const useReaderWindowHistory = (sessionId: string | null) => {
  const store = useStore();

  useLayoutEffect(() => {
    if (sessionId) {
      return connectWindowHistory({ store, sessionId });
    }
  }, [sessionId, store]);
};
