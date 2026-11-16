import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { StoreProvider, store } from '../../src/store';
import { mainActions } from '../../src/store/main';
import { useAudio } from '../../src/hooks/effects/audio/useAudio';

const effectId = 'strict-fade';
const container = document.createElement('div');
const root = createRoot(container);

const Probe = ({ src }: {
  src: string;
}) => {
  useAudio({
    id: effectId,
    page: 1,
    src,
    loop: true,
    fadeOutWhenUnload: true,
  });

  return null;
};

export const replace = (src: string) => {
  root.render(
    <StrictMode>
      <StoreProvider>
        <Probe src={src} />
      </StoreProvider>
    </StrictMode>,
  );
};

export const mount = () => {
  document.body.append(container);
  store.dispatch(mainActions.setStoryPages(['first', 'second']));
  store.dispatch(mainActions.setPage(1));
  store.dispatch(mainActions.setIsAudioUnlocked(true));
  replace('/tests/audioLifecycle/tone.wav');
};

export const current = () => store.getState().audioEffects.audioInstances[effectId];

export const unmount = () => {
  root.unmount();
  container.remove();
};
