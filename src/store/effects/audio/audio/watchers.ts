import type { PayloadAction } from '@reduxjs/toolkit';
import { select, takeEvery } from 'redux-saga/effects';

import type { HowlInstances } from '@types';

import { store } from '@store/store';

import { removeOwnedAudio } from '@controllers/bookAudio/ownedAudio';

import { unloadAudio } from '@utils/effects/audio/unloadAudio';

import { actions } from './slice';
import { selectors } from './selectors';

import type { RemoveAudioInstancePayload } from './@types';

const unloadRemovedAudio = async (instance: RemoveAudioInstancePayload['instance']) => {
  let previousVolume = store.getState().volume;

  const unsubscribe = store.subscribe(() => {
    const { type } = instance;

    const currentVolume = store.getState().volume;

    if (previousVolume.global !== currentVolume.global || previousVolume[type] !== currentVolume[type]) {
      instance.volume(currentVolume[type] / 100);
    }

    previousVolume = currentVolume;
  });

  try {
    await unloadAudio(instance);
  } finally {
    unsubscribe();
  }
};

export function* watchRemoveAudioInstance(action: PayloadAction<RemoveAudioInstancePayload>) {
  const { id, instance } = action.payload;

  const audioInstances: HowlInstances = yield select(selectors.audioInstances);

  // Если тот же экземпляр снова зарегистрировали, выгружать его нельзя.
  if (audioInstances[id] === instance) {
    return;
  }

  const removeOwned = removeOwnedAudio.get(instance);

  if (removeOwned) {
    removeOwned();

    return;
  }

  if (!instance.isUnloading) {
    // Once removed, the normal mixer no longer reaches the still-audible Howl.
    void unloadRemovedAudio(instance);
  }
}

export function* watchActions() {
  yield takeEvery(actions.removeAudioInstance, watchRemoveAudioInstance);
}
