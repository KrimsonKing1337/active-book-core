import { useEffect, useRef } from 'react';

import { useSelector } from '@store';
import { mainSelectors } from '@store/main';

import { useGoToPage } from '@hooks/control/useGoToPage';

type NavigationProps = {
  onNavigate: (page: number) => void;
};

export const Navigation = ({ onNavigate }: NavigationProps) => {
  const { goToPage } = useGoToPage();
  const page = useSelector(mainSelectors.page);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      goToPage(1);
    }
  }, [goToPage]);

  useEffect(() => {
    onNavigate(page);
  }, [page, onNavigate]);

  return (
    <nav aria-label="Тестовая навигация">
      {[1, 2, 4, 3].map((pageCur) => {
        const label = pageCur === 3 ? 'Выйти из диапазона' : `Страница ${pageCur}`;

        return (
          <button
            key={pageCur}
            type="button"
            aria-pressed={page === pageCur}
            onClick={() => goToPage(pageCur)}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
};
