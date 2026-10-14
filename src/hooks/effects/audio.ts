import { useEffect } from 'react';

import type { AudioEffectOptions } from '@types';

import { store, useSelector, useDispatch } from 'store';

import { mainSelectors } from 'store/main';
import { audioEffectsActions, audioEffectsSelectors } from 'store/effects/audio/audio';

import { effectsActions } from 'store/effects/common';

import { HowlWrapper, type HowlWrapperOptions } from 'utils/effects/audio/HowlWrapper';

export function useAudio({
  id,
  page,
  src,
  format,
  lifecycle = 'auto',
  type = 'sfx',
  loop = false,
  playOnLoad = false,
  stopBy = 0,
  delay = 0,
  relativeVolume = 100,
  screamer = false,
  fadeOutWhenUnload = true,
  onPlay = () => {},
  onPause = () => {},
  onStop = () => {},
  onUnload = () => {},
}: AudioEffectOptions) {
  const dispatch = useDispatch();

  const currentPage = useSelector(mainSelectors.page);
  const isAudioUnlocked = useSelector(mainSelectors.isAudioUnlocked);
  const audioInstances = useSelector(audioEffectsSelectors.audioInstances);

  const formatKey = format?.join(',');

  useEffect(() => {
    if (currentPage !== page || !isAudioUnlocked || !id || !src) {
      return;
    }

    // В manual экземпляр принадлежит приложению: React лишь обеспечивает его создание.
    const existing = store.getState().audioEffects.audioInstances[id];

    if (lifecycle === 'manual' && existing && !existing.isUnloading) {
      return;
    }

    const options: HowlWrapperOptions = {
      id,
      page,
      src: [src],
      format,
      type,
      loop,
      playOnLoad,
      relativeVolume,
      screamer,
      fadeOutWhenUnload,
      stopBy,
      delay,
      onPlay,
      onPause,
      onStop,
      onUnload,
    };

    const instance = new HowlWrapper(options);

    dispatch(effectsActions.setAudiosAmountInc());

    let isReady = false;

    const markReady = () => {
      if (isReady) {
        return;
      }

      isReady = true;
      dispatch(effectsActions.setAudioReady());
    };

    if (instance.howlInst.state() === 'loaded') {
      markReady();
    } else {
      instance.howlInst.once('load', markReady);
      instance.howlInst.once('loaderror', markReady);
    }

    dispatch(audioEffectsActions.setAudioInstance(instance));

    if (lifecycle === 'manual') {
      return;
    }

    return () => {
      instance.howlInst.off('load', markReady);
      instance.howlInst.off('loaderror', markReady);

      // Незаконченная загрузка не должна навсегда удерживать isAudiosLoading.
      markReady();

      dispatch(audioEffectsActions.removeAudioInstance({ id, instance }));
    };
  }, [currentPage, isAudioUnlocked, id, page, src, formatKey, lifecycle]);

  return audioInstances[id];
}
