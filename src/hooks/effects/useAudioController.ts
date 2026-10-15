import { useCallback } from 'react';

import { store, useDispatch, useSelector } from 'store';

import { audioEffectsActions, audioEffectsSelectors } from 'store/effects/audio/audio';

// Управление по ID работает и после размонтирования компонента Audio (lifecycle="manual")
export const useAudioController = (id: string) => {
  const dispatch = useDispatch();

  const audioInstances = useSelector(audioEffectsSelectors.audioInstances);

  const audio = audioInstances[id] ?? null;

  const getAudio = useCallback(() => {
    return store.getState().audioEffects.audioInstances[id];
  }, [id]);

  const play = useCallback((withFadeIn = false) => {
    return getAudio()?.play(withFadeIn);
  }, [getAudio]);

  const pause = useCallback((withFadeOut = false) => {
    return getAudio()?.pause(withFadeOut);
  }, [getAudio]);

  const stop = useCallback((withFadeOut = false) => {
    return getAudio()?.stop(withFadeOut);
  }, [getAudio]);

  const remove = useCallback(() => {
    const instance = getAudio();

    if (!instance) {
      return;
    }

    dispatch(audioEffectsActions.removeAudioInstance({ id, instance }));
  }, [id, getAudio, dispatch]);

  return {
    audio,
    play,
    pause,
    stop,
    remove,
  };
};
