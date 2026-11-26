import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react';

import { storeContext } from '@store';

export const BookPresentationContext = createContext<string | null>(null);

const noVisit = () => null;
const noSubscribe = () => () => {};

export const usePageVisit = () => {
  const bookSessionId = useContext(BookPresentationContext);
  const store = useContext(storeContext)?.store;

  const getSnapshot = useCallback(() => {
    const main = store?.getState().main;

    if (!bookSessionId || !main) {
      return null;
    }

    if (bookSessionId !== main.bookSessionId) {
      return null;
    }

    return main.visit;
  }, [store, bookSessionId]);

  let subscribe: (onStoreChange: () => void) => () => void = noSubscribe;

  if (bookSessionId && store) {
    subscribe = store.subscribe;
  }

  return useSyncExternalStore(subscribe, getSnapshot, noVisit);
};

export const usePagePresented = () => {
  const session = useContext(BookPresentationContext);
  const visit = usePageVisit();

  const presented = visit !== null && visit.presentedAt !== null;

  return !session || presented;
};

/** Check delayed work against the visit it was started for. */
export const useCanStartPageEffects = () => {
  const store = useContext(storeContext)?.store;
  const sessionId = useContext(BookPresentationContext);

  const visitId = usePageVisit()?.id;

  return useCallback(() => {
    if (!sessionId) {
      return true;
    }

    if (!store) {
      return false;
    }

    const { bookSessionId, visit } = store.getState().main;

    if (!visit) {
      return false;
    }

    const isCurrentSession = sessionId === bookSessionId;
    const isCurrentVisit = visitId === visit.id;
    const isPresented = visit.presentedAt !== null;

    return isCurrentSession && isCurrentVisit && isPresented;
  }, [
    store,
    sessionId,
    visitId,
  ]);
};
