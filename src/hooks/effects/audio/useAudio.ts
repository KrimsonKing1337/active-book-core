import {
  useContext,
  useLayoutEffect,
} from 'react';

import type { AudioEffectOptions } from '@types';

import {
  store,
  useSelector,
  useDispatch,
} from '@store';

import { mainSelectors } from '@store/main';
import { audioEffectsActions, audioEffectsSelectors } from '@store/effects/audio/audio';

import { BookAudioContext } from '@controllers/bookAudio/context';
import { removeOwnedAudio } from '@controllers/bookAudio/ownedAudio';

import { BookPresentationContext } from '@hooks/pagePresentation/context';
import { usePageResource } from '@hooks/pagePresentation/usePageResource';

import { HowlWrapper, type HowlWrapperOptions } from '@utils/effects/audio/HowlWrapper';

const audioSessions = new WeakMap<HowlWrapper, string | null>();

export const useAudio = (passedOptions: AudioEffectOptions) => {
  const {
    id,
    page,
    src,
    format,
    lifecycle = 'auto',
    type = 'sfx',
    loop = false,
    stopBy = 0,
    delay = 0,
    relativeVolume = 100,
    screamer = false,
    fadeOutWhenUnload = true,

    onPlay = () => {},
    onPause = () => {},
    onStop = () => {},
    onUnload = () => {},
  } = passedOptions;

  const bookSession = useContext(BookPresentationContext);
  const bookAudio = useContext(BookAudioContext);

  const dispatch = useDispatch();

  const currentPage = useSelector(mainSelectors.page);
  const isAudioUnlocked = useSelector(mainSelectors.isAudioUnlocked);
  const audioInstances = useSelector(audioEffectsSelectors.audioInstances);

  const canPrepare = !!bookSession || isAudioUnlocked;
  const formatKey = format?.join(',');

  useLayoutEffect(() => {
    const isSamePage = currentPage === page;
    const hasMissingSourceOrId = !id || !src;

    if (!canPrepare || !isSamePage || hasMissingSourceOrId) {
      return;
    }

    if (Object.hasOwn(Object.prototype, id)) {
      throw new Error(`Audio ID "${id}" is reserved`);
    }

    const state = store.getState();

    // В manual экземпляр принадлежит приложению: React лишь обеспечивает его создание
    const existing = state.audioEffects.audioInstances[id];

    if (bookAudio?.hasDescription(id) || (existing && removeOwnedAudio.has(existing))) {
      throw new Error(`Audio ID "${id}" is already declared in the book`);
    }

    if (lifecycle === 'manual' && existing && !existing.isUnloading) {
      if (audioSessions.get(existing) === bookSession) {
        return;
      }

      dispatch(audioEffectsActions.removeAudioInstance({ id, instance: existing }));
    }

    if (existing && lifecycle !== 'manual') {
      throw new Error(`Audio ID "${id}" is already registered`);
    }

    const options: HowlWrapperOptions = {
      id,
      page,
      src: [src],
      format,
      type,
      loop,
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

    audioSessions.set(instance, bookSession);

    dispatch(audioEffectsActions.setAudioInstance(instance));

    if (lifecycle === 'manual') {
      return;
    }

    return () => {
      dispatch(audioEffectsActions.removeAudioInstance({
        id,
        instance,
      }));
    };
  }, [
    currentPage,
    canPrepare,
    bookSession,
    bookAudio,
    id,
    page,
    src,
    formatKey,
    lifecycle,
  ]);

  const instance = audioInstances[id];
  const theSamePage = currentPage === page;

  let prepareResource = null;

  if (canPrepare && theSamePage && instance) {
    prepareResource = instance.observeLoad;
  }

  usePageResource(prepareResource);

  return instance;
};
