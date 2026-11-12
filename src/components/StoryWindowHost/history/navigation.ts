import type { HistoryMarker } from './@types';

type PopListener = (event: PopStateEvent, pending: HistoryMarker | null) => void;

// Traversal is asynchronous and can outlive a BookSession (including StrictMode cleanup).
// Keep only the expected transport destination, never a window or a restoration instruction.
// Native repeated Back can cancel a compensating Forward without dispatching its completion.
export const navigation: { pending: HistoryMarker | null } = { pending: null };
let listener: PopListener | null = null;

const hasPendingClosingBack = () => {
  return navigation.pending?.position === 'base';
};

const handlePopState = (event: PopStateEvent) => {
  const pending = navigation.pending;
  navigation.pending = null;
  listener?.(event, pending);

  if (!listener && !hasPendingClosingBack()) {
    window.removeEventListener('popstate', handlePopState);
  }
};

export const listenToHistory = (handlePop: PopListener) => {
  listener = handlePop;
  window.addEventListener('popstate', handlePopState);

  return () => {
    if (listener !== handlePop) {
      return;
    }

    listener = null;

    // Only an internal closing Back needs a listener after teardown. A cancelled compensation
    // must not retain listeners indefinitely; its marker still protects a later connection.
    if (!hasPendingClosingBack()) {
      window.removeEventListener('popstate', handlePopState);
    }
  };
};

export const traversePair = (departure: HistoryMarker) => {
  if (departure.position === 'guard') {
    navigation.pending = { ...departure, position: 'base' };
    window.history.back();

    return;
  }

  navigation.pending = { ...departure, position: 'guard' };
  window.history.go(1);
};
