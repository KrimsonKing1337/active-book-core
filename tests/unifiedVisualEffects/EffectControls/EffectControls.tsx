import { useGoToPage } from '../../../src/hooks/control/useGoToPage';
import { useVisualEffects } from '../../../src/controllers/visualEffects/context';
import { TestControls } from '../../bookVisualRoot/TestControls';

export const EffectControls = () => {
  const { goToPage } = useGoToPage();
  const effects = useVisualEffects();
  window.realVisual = {
    effects,
    goToPage,
  };

  return <TestControls />;
};

declare global {
  interface Window {
    realVisual: {
      effects: ReturnType<typeof useVisualEffects>;
      goToPage: (page: number) => void;
    };
  }
}
