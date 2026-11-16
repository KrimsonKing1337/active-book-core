import type { PayloadAction } from '@reduxjs/toolkit';
import { select, takeEvery } from 'redux-saga/effects';

import type { HowlInstances } from '@types';

import { unloadAudio } from '@utils/effects/audio/unloadAudio';

import { actions } from './slice';
import { selectors } from './selectors';

import type { RemoveAudioInstancePayload } from './@types';

export function* watchRemoveAudioInstance(action: PayloadAction<RemoveAudioInstancePayload>) {
  const { id, instance } = action.payload;
  const audioInstances: HowlInstances = yield select(selectors.audioInstances);

  // Если тот же экземпляр снова зарегистрировали, выгружать его нельзя.
  if (audioInstances[id] === instance) {
    return;
  }

  if (!instance.isUnloading) {
    void unloadAudio(instance);
  }
}

export function* watchActions() {
  yield takeEvery(actions.removeAudioInstance, watchRemoveAudioInstance);
}
