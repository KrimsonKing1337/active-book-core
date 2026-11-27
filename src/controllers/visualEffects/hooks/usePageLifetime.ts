import { useSyncExternalStore } from 'react';

import type { EffectLifetime } from '@active-book/types';

import { useSelector } from '@store';
import { mainSelectors } from '@store/main';

import type { VisualEffects } from '../createVisualEffects';

const subscribeEmpty = () => () => {};
const readNoPages = () => 0;

/** Navigation and editor structure can commit separately; never declare a transient invalid page. */
export const usePageLifetime = (session: VisualEffects | null): EffectLifetime | null => {
  const pageSubscribe = session?.subscribe ?? subscribeEmpty;
  const pageCount = session?.getPageCount ?? readNoPages;

  const pages = useSyncExternalStore(
    pageSubscribe,
    pageCount,
    pageCount,
  );

  const page = useSelector(mainSelectors.page);

  if (page < 1 || page > pages) {
    return null;
  }

  return {
    type: 'page',
    page,
  };
};
