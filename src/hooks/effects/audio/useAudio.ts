import {
  useCallback,
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
import { type SettlePageResource, usePageResource } from '@hooks/pagePresentation/usePageResource';

import { HowlWrapper, type HowlWrapperOptions } from '@utils/effects/audio/HowlWrapper';

const failedLoads = new WeakSet<HowlWrapper>();
const unloadListeners = new WeakMap<HowlWrapper, Set<() => void>>();
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

    const handleUnload = () => {
      const instanceUnloadListeners = unloadListeners.get(instance);

      if (instanceUnloadListeners) {
        instanceUnloadListeners.forEach((cancel) => cancel());
      }

      onUnload();
    };

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
      onUnload: handleUnload,
    };

    const instance = new HowlWrapper(options);

    audioSessions.set(instance, bookSession);

    // Howler can reject the format synchronously before event listeners attach.
    if (instance.howlInst.state() === 'unloaded') {
      failedLoads.add(instance);
    }

    instance.howlInst.once('loaderror', () => {
      failedLoads.add(instance);
    });

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

  const prepare = useCallback((settle: SettlePageResource) => {
    if (!instance || instance.isUnloading) {
      settle('cancelled');

      return;
    }

    if (failedLoads.has(instance)) {
      settle('failed');

      return;
    }

    if (instance.howlInst.state() === 'loaded') {
      settle('ready');

      return;
    }

    const loaded = () => settle();
    const failed = () => settle('failed');
    const cancel = () => settle('cancelled');

    const listeners = unloadListeners.get(instance) ?? new Set();

    unloadListeners.set(instance, listeners);
    listeners.add(cancel);

    instance.howlInst.on('load', loaded);
    instance.howlInst.on('loaderror', failed);

    return () => {
      listeners.delete(cancel);

      instance.howlInst.off('load', loaded);
      instance.howlInst.off('loaderror', failed);
    };
  }, [instance]);

  let prepareResource: typeof prepare | null = null;

  if (canPrepare && currentPage === page && instance) {
    prepareResource = prepare;
  }

  usePageResource(prepareResource);

  return instance;
};
