import { useCallback } from 'react';

import { useDispatch, useSelector } from '@store';
import { mainActions, mainSelectors } from '@store/main';

export const useGoToPage = () => {
  const dispatch = useDispatch();
  const currentPage = useSelector(mainSelectors.page);
  const pages = useSelector(mainSelectors.pages);

  const goToPage = useCallback((page: number | string | null) => {
    dispatch(mainActions.setPage(page));
  }, [dispatch]);

  const goNextPage = useCallback(() => {
    if (currentPage < pages) {
      goToPage(currentPage + 1);
    }
  }, [
    currentPage,
    pages,
    goToPage,
  ]);

  const goPrevPage = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  return {
    goToPage,
    goNextPage,
    goPrevPage,
  };
};
