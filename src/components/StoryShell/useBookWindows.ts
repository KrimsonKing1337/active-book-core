import { useCallback } from 'react';

import { useDispatch, useSelector } from '@store';
import { mainActions, mainSelectors } from '@store/main';
import { bookmarksActions, bookmarksSelectors } from '@store/bookmarks';

import { useWindowHistory } from '@hooks/control/useWindowHistory';

export const useBookWindows = (scope: string) => {
  const dispatch = useDispatch();
  const menu = useSelector(mainSelectors.menuActiveState);
  const bookmarksOpen = useSelector(bookmarksSelectors.isOpen);
  const windowId = bookmarksOpen ? 'bookmarks' : menu;

  const change = useCallback((next: string | null) => {
    dispatch(bookmarksActions.setIsOpen(next === 'bookmarks'));

    if (next === 'menu' || next === 'tableOfContents' || next === 'achievementsProgress') {
      dispatch(mainActions.setMenuActiveState(next));
    } else {
      dispatch(mainActions.setMenuActiveState(null));
    }
  }, [dispatch]);

  useWindowHistory(scope, windowId, change, true);
};
