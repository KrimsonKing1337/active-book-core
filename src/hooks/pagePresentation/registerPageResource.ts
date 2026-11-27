import { nanoid } from '@reduxjs/toolkit';

import type { store as appStore } from '@store';
import type { PageResourceOutcome } from '@store/main/@types';

import { mainActions } from '@store/main';

export type SettlePageResource = (outcome?: PageResourceOutcome) => void;
export type PreparePageResource = (settle: SettlePageResource) => void | (() => void);

type ResourceRegistration = {
  visitId: number | undefined;
  prepare: PreparePageResource;
};

export const registerPageResource = (
  store: Pick<typeof appStore, 'getState' | 'dispatch'>,
  { visitId, prepare }: ResourceRegistration,
) => {
  const { visit } = store.getState().main;

  if (!visit || visit.id !== visitId || visit.presentedAt !== null) {
    return;
  }

  const resource = { visitId, resourceId: nanoid() };

  store.dispatch(mainActions.registerPageResource(resource));

  let isPending = true;
  const settle: SettlePageResource = (outcome = 'ready') => {
    if (!isPending) {
      return;
    }

    isPending = false;
    store.dispatch(mainActions.settlePageResource({ ...resource, outcome }));
  };

  const cleanup = prepare(settle);

  return () => {
    settle('cancelled');
    cleanup?.();
  };
};
