import { useVisualEffects } from '@controllers/visualEffects';

import { useGoToPage } from '@hooks/control/useGoToPage';

import { TestControls } from '../../bookVisualRoot/TestControls';

export const EffectControls = () => {
  const { goToPage } = useGoToPage();

  const effects = useVisualEffects();

  window.realVisual = {
    effects,
    goToPage,
  };

  return (
    <TestControls />
  );
};

declare global {
  interface Window {
    realVisual: {
      effects: ReturnType<typeof useVisualEffects>;
      goToPage: (page: number) => void;
    };
  }
}
