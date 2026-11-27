import { nanoid } from 'nanoid';

import type { store as appStore } from '@store';

import type { PageResourceOutcome } from '@store/main/@types';
import { mainActions } from '@store/main';

export type SettlePageResource = (outcome?: PageResourceOutcome) => void;
export type PreparePageResource = (settle: SettlePageResource) => void | (() => void);

type PageResourceStore  = Pick<typeof appStore, 'getState' | 'dispatch'>;

type ResourceRegistration = {
  visitId: number | undefined;
  prepare: PreparePageResource;
};

export const registerPageResource = (
  store: PageResourceStore,
  registration: ResourceRegistration) => {
  const { visitId, prepare } = registration;
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

    store.dispatch(mainActions.settlePageResource({ ...resource, outcome }));
  };

  const cleanup = prepare(settle);

  return () => {
    settle('cancelled');
    cleanup?.();
  };
};
