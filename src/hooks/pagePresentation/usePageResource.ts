import { useContext, useLayoutEffect } from 'react';

import { nanoid } from '@reduxjs/toolkit';

import { storeContext } from '@store';

import type { PageResourceOutcome } from '@store/main/@types';

import { mainActions } from '@store/main';

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
    if (!store || !prepare) {
      return;
    }

    const { visit } = store.getState().main;

    if (!visit || visit.id !== visitId) {
      return;
    }

    if (visit.presentedAt !== null) {
      return;
    }

    const resourceId = nanoid();
    const resource = { visitId, resourceId };

    store.dispatch(mainActions.registerPageResource(resource));

    let isPending = true;

    const settle: SettlePageResource = (outcome = 'ready') => {
      if (!isPending) {
        return;
      }

      isPending = false;

      store.dispatch(mainActions.settlePageResource({
        ...resource,
        outcome,
      }));
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
