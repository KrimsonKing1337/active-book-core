import { useContext, useLayoutEffect } from 'react';

import { nanoid } from '@reduxjs/toolkit';

import { storeContext } from '@store';
import { mainActions } from '@store/main';
import type { PageResourceOutcome } from '@store/main/@types';

import { usePageVisit } from './context';

export type SettlePageResource = (outcome?: PageResourceOutcome) => void;
type PrepareResource = (settle: SettlePageResource) => void | (() => void);

/**
 * Subscribe during the initial commit. Call settle after success or failure,
 * including when the resource was already available. Cleanup cancels this registration.
 * Memoize prepare according to the identity of the resource.
 */
export const usePageResource = (prepare: PrepareResource | null) => {
  const store = useContext(storeContext)?.store;
  const visitId = usePageVisit()?.id;

  useLayoutEffect(() => {
    const visit = store?.getState().main.visit;

    if (!store || !prepare || !visit || visit.id !== visitId || visit.presentedAt !== null) {
      return;
    }

    const resource = { visitId, resourceId: nanoid() };

    store.dispatch(mainActions.registerPageResource(resource));

    let pending = true;

    const settle: SettlePageResource = (outcome = 'ready') => {
      if (pending) {
        pending = false;
        store.dispatch(mainActions.settlePageResource({ ...resource, outcome }));
      }
    };

    const cleanup = prepare(settle);

    return () => {
      settle('cancelled');
      cleanup?.();
    };
  }, [
    store,
    visitId,
    prepare,
  ]);
};
