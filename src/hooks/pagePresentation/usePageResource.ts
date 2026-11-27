import { useContext, useLayoutEffect } from 'react';

import { storeContext } from '@store';

import type { PreparePageResource } from './registerPageResource';

import { usePageVisit } from './context';
import { registerPageResource } from './registerPageResource';

export type { SettlePageResource } from './registerPageResource';

/**
 * Subscribe during the initial commit. Call settle after success or failure,
 * including when the resource was already available. Cleanup cancels this registration.
 * Memoize prepare according to the identity of the resource.
 */
export const usePageResource = (prepare: PreparePageResource | null) => {
  const store = useContext(storeContext)?.store;
  const visitId = usePageVisit()?.id;

  useLayoutEffect(() => {
    if (!store || !prepare) {
      return;
    }

    return registerPageResource(store, { visitId, prepare });
  }, [
    store,
    visitId,
    prepare,
  ]);
};
