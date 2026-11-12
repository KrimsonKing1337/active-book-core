import type { HistoryMarker } from './@types';

export const markerKey = 'activeBookWindows';

export const readMarker = (state: unknown): HistoryMarker | null => {
  if (!state || typeof state !== 'object' || !(markerKey in state)) {
    return null;
  }

  const marker = state[markerKey];

  if (!marker || typeof marker !== 'object') {
    return null;
  }

  if (!('version' in marker) || marker.version !== 1 ||
      !('sessionId' in marker) || typeof marker.sessionId !== 'string' || !marker.sessionId ||
      !('pairId' in marker) || typeof marker.pairId !== 'string' || !marker.pairId ||
      !('position' in marker) || (marker.position !== 'base' && marker.position !== 'guard')) {
    return null;
  }

  return {
    version: 1,
    sessionId: marker.sessionId,
    pairId: marker.pairId,
    position: marker.position,
  };
};

export const withMarker = (state: unknown, marker: HistoryMarker) => {
  if (state && typeof state === 'object') {
    return { ...state, [markerKey]: marker };
  }

  return { [markerKey]: marker };
};

export const isSamePair = (first: HistoryMarker | null, second: HistoryMarker | null) => {
  return !!first && !!second && first.sessionId === second.sessionId && first.pairId === second.pairId;
};

export const isSamePosition = (first: HistoryMarker | null, second: HistoryMarker | null) => {
  if (!first || !second) {
    return first === second;
  }

  return isSamePair(first, second) && first.position === second.position;
};
