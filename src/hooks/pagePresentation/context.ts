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
  const session = useContext(BookPresentationContext);
  const store = useContext(storeContext)?.store;

  const getSnapshot = useCallback(() => {
    const main = store?.getState().main;

    return session && session === main?.bookSessionId ? main.visit : null;
  }, [store, session]);

  return useSyncExternalStore(session && store ? store.subscribe : noSubscribe, getSnapshot, noVisit);
};

export const usePagePresented = () => {
  const session = useContext(BookPresentationContext);
  const visit = usePageVisit();

  return !session || (visit !== null && visit.presentedAt !== null);
};


/** Check delayed work against the visit it was started for. */
export const useCanStartPageEffects = () => {
  const store = useContext(storeContext)?.store;
  const session = useContext(BookPresentationContext);
  const visitId = usePageVisit()?.id;

  return useCallback(() => {
    if (!session) {
      return true;
    }

    if (!store) {
      return false;
    }

    const { bookSessionId, visit } = store.getState().main;

    return session === bookSessionId && !!visit && visitId === visit.id && visit.presentedAt !== null;
  }, [
    store,
    session,
    visitId,
  ]);
};
