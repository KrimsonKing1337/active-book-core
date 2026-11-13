import { windowsActions } from '@store/windows';

import type { HistoryConnection, HistoryMarker } from './@types';

import { pushGuard } from './entries';

import {
  listenToHistory,
  navigation,
  traversePair,
} from './navigation';

import {
  isSamePair,
  isSamePosition,
  readMarker,
} from './utils';

export const connectWindowHistory = ({ store, sessionId }: HistoryConnection) => {
  let position = readMarker(window.history.state);
  let isHandlingPop = false;

  const getActiveWindow = () => {
    const { main, windows } = store.getState();

    if (windows.sessionId !== sessionId || windows.pageId !== main.pageId) {
      return null;
    }

    return windows.activeWindow;
  };

  let previousInstanceId: string | null = null;

  const reconcile = () => {
    const active = getActiveWindow();

    const previous = previousInstanceId;

    previousInstanceId = active?.instanceId ?? null;

    if (isHandlingPop) {
      return;
    }

    if (navigation.pending) {
      // Closing Back must finish before arming a successor. A compensating Forward may be
      // canceled by rapid native Back without another popstate. It must not freeze UI commands.
      if (navigation.pending.position === 'base' || previous === previousInstanceId) {
        return;
      }
    }

    // An embedding application may have replaced history.state since the last notification.
    position = readMarker(window.history.state);

    const isOwnGuard = position?.sessionId === sessionId && position.position === 'guard';

    if (active) {
      if (!isOwnGuard) {
        position = pushGuard(sessionId);
      }

      return;
    }

    if (previous && isOwnGuard && position) {
      traversePair(position);
    }
  };

  const handlePopState = (event: PopStateEvent, pending: HistoryMarker | null) => {
    const departure = position;

    position = readMarker(event.state);

    const currentPosition = readMarker(window.history.state);

    // An earlier host popstate listener may already have opened a successor and pushed its Guard.
    if (!isSamePosition(position, currentPosition)) {
      position = currentPosition;

      return;
    }

    if (pending && isSamePosition(pending, position)) {
      // A completion belongs to the transport, not the window that initiated it.
      // Re-arm the current Redux window only on the known destination of that operation.
      if (pending.position === 'guard' && position?.sessionId === sessionId && !getActiveWindow()) {
        traversePair(position);
      } else {
        reconcile();
      }

      return;
    }

    // An unmatched event may instead be a new Back after a cancelled compensation.
    // Only the outstanding internal closing Back shields a successor from unrelated completions.
    if (pending?.position === 'base') {
      return;
    }

    if (isSamePosition(departure, position)) {
      return;
    }

    const active = getActiveWindow();

    if (!active || departure?.sessionId !== sessionId || departure.position !== 'guard') {
      return;
    }

    const isOwnBack = isSamePair(departure, position) && position?.position === 'base';

    if (!active.canClose) {
      if (isOwnBack && position) {
        traversePair(position);
      }

      return;
    }

    isHandlingPop = true;

    store.dispatch(windowsActions.requestClose({ sessionId, instanceId: active.instanceId }));

    isHandlingPop = false;
  };

  const unsubscribe = store.subscribe(reconcile);
  const stopListening = listenToHistory(handlePopState);

  reconcile();

  return () => {
    unsubscribe();
    stopListening();
    // No traversal on cleanup: ownership may already belong to another reader.
  };
};
