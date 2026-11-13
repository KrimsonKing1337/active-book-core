import { isRecord } from '@utils/isRecord';

import type { HistoryMarker } from './@types';

export const markerKey = 'activeBookWindows';

export const readMarker = (state: unknown): HistoryMarker | null => {
  if (!isRecord(state)) {
    return null;
  }

  const marker = state[markerKey];

  if (!isRecord(marker)) {
    return null;
  }

  const {
    version,
    sessionId,
    pairId,
    position,
  } = marker;

  if (version !== 1) {
    return null;
  }

  if (typeof sessionId !== 'string' || !sessionId) {
    return null;
  }

  if (typeof pairId !== 'string' || !pairId) {
    return null;
  }

  if (position !== 'base' && position !== 'guard') {
    return null;
  }

  return {
    version,
    sessionId,
    pairId,
    position,
  };
};

export const withMarker = (state: unknown, marker: HistoryMarker) => {
  if (state && typeof state === 'object') {
    return {
      ...state,
      [markerKey]: marker,
    };
  }

  return {
    [markerKey]: marker,
  };
};

type HistoryUnit = HistoryMarker | null;

export const isSamePair = (first: HistoryUnit, second: HistoryUnit) => {
  if (!first || !second) {
    return false;
  }

  return first.sessionId === second.sessionId && first.pairId === second.pairId;
};

export const isSamePosition = (first: HistoryUnit, second: HistoryUnit) => {
  if (!first || !second) {
    return first === second;
  }

  const pairIsSame = isSamePair(first, second);

  return pairIsSame && first.position === second.position;
};
