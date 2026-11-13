import type { store } from '@store';

export type HistoryMarker = {
  version: 1;
  sessionId: string;
  pairId: string;
  position: 'base' | 'guard';
};

export type HistoryConnection = {
  store: Pick<typeof store, 'getState' | 'dispatch' | 'subscribe'>;
  sessionId: string;
};
