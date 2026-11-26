import type { HowlWrapper } from './HowlWrapper';

type UnloadAudioOptions = {
  waitTillTheEnd?: boolean;
};

export const unloadAudio = async (instance: HowlWrapper, { waitTillTheEnd = false }: UnloadAudioOptions = {}) => {
  if (waitTillTheEnd) {
    await instance.waitTillTheEnd();
  }

  await instance.unload({ immediate: waitTillTheEnd });
};
