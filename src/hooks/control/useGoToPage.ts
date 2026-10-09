import { useCallback } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import { useDispatch, useSelector } from 'store';

import { mainActions, mainSelectors } from 'store/main';

export function useGoToPage() {
  const dispatch = useDispatch();

  const currentPage = useSelector(mainSelectors.page);
  const pages = useSelector(mainSelectors.pages);

  const { pathname } = useLocation();
  const navigate = useNavigate();

  const goToPage = useCallback((page: number) => {
    if (page === 0) {
      dispatch(mainActions.setPage(0));
      navigate('/');

      return;
    }

    dispatch(mainActions.setPage(page));
    navigate(`/page-${page}`);
  }, [dispatch, navigate]);

  const goNextPage = useCallback(() => {
    if (pathname === '/') {
      goToPage(1);

      return;
    }

    const nextIndex = currentPage + 1;

    if (nextIndex > pages) {
      return;
    }

    goToPage(nextIndex);
  }, [currentPage, pages, pathname, goToPage]);

  const goPrevPage = useCallback(() => {
    if (pathname === '/') {
      return;
    }

    goToPage(currentPage - 1);
  }, [currentPage, pathname, goToPage]);

  return {
    goToPage,
    goNextPage,
    goPrevPage,
  };
}
