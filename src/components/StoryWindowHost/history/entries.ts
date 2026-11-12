import { nanoid } from '@reduxjs/toolkit';

import type { HistoryMarker } from './@types';

import { withMarker } from './utils';

export const pushGuard = (sessionId: string): HistoryMarker => {
  const base: HistoryMarker = {
    version: 1,
    sessionId,
    pairId: nanoid(),
    position: 'base',
  };
  const guard: HistoryMarker = { ...base, position: 'guard' };

  window.history.replaceState(withMarker(window.history.state, base), '');
  window.history.pushState(withMarker(window.history.state, guard), '');

  return guard;
};
