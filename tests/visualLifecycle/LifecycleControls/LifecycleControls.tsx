import { useEffect } from 'react';

import { useGoToPage } from '../../../src/hooks/control/useGoToPage';

import { testApi } from '../testSession';

export const LifecycleControls = () => {
  const { goToPage } = useGoToPage();

  useEffect(() => {
    testApi.goToPage = goToPage;
  }, [goToPage]);

  return null;
};
