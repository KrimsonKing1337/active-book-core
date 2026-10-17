import { store } from 'store';

export const getAudioInstances = () => {
  const storeState = store.getState();

  const { audioEffects, audioBgEffects } = storeState;

  return {
    audioInstances: audioEffects.audioInstances,
    audioBgInstances: audioBgEffects.audioInstances,
  };
};
