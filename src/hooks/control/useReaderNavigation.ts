import { useCallback } from 'react';

import { useStore } from '@store';
import { mainActions, mainSelectors } from '@store/main';

import { useAppMode } from '@components/App/AppModeContext';

export const useReaderNavigation = () => {
  const store = useStore();
  const appMode = useAppMode();

  const goToPage = useCallback((page: string | number | null) => {
    const state = store.getState();
    const isPagePresented = mainSelectors.isPagePresented(state);

    if (appMode === 'editor' || isPagePresented) {
      store.dispatch(mainActions.setPage(page));
    }
  }, [appMode, store]);

  const goPrevPage = useCallback(() => {
    const state = store.getState();
    const page = mainSelectors.page(state);

    if (page > 0) {
      goToPage(page - 1);
    }
  }, [goToPage, store]);

  const goNextPage = useCallback(() => {
    const state = store.getState();
    const page = mainSelectors.page(state);

    if (page < mainSelectors.pages(state)) {
      goToPage(page + 1);
    }
  }, [goToPage, store]);

  return {
    goToPage,
    goPrevPage,
    goNextPage,
  };
};
