import { useDispatch } from '@store';
import { volumeActions } from '@store/volume';

import { useVisualEffects } from '@controllers/visualEffects';

import { useGoToPage } from '@hooks/control/useGoToPage';

import { TestControls } from '../../bookVisualRoot/TestControls';

export const EffectControls = () => {
  const { goToPage } = useGoToPage();

  const effects = useVisualEffects();
  const dispatch = useDispatch();

  window.realVisual = {
    effects,
    setVolume: (global: number, videos: number) => {
      dispatch(volumeActions.setGlobal(global));
      dispatch(volumeActions.setVideos(videos));
    },
    goToPage,
  };

  return (
    <TestControls />
  );
};

declare global {
  interface Window {
    realVisual: {
      setVolume: (global: number, videos: number) => void;
      effects: ReturnType<typeof useVisualEffects>;
      goToPage: (page: number) => void;
    };
  }
}
