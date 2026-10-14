import type { PayloadAction } from '@reduxjs/toolkit';
import { put, select, takeEvery } from 'redux-saga/effects';

import type { HowlInst, HowlInstances } from '@types';

import { unloadAudio } from 'utils/effects/audio/unloadAudio';

import { actions } from './slice';
import { selectors } from './selectors';

import type { DeleteAudioInstancePayload } from './@types';

export function* watchDeleteAudioInstance(action: PayloadAction<DeleteAudioInstancePayload>) {
  const { payload } = action;

  const id = typeof payload === 'string' ? payload : payload.id;
  const audioInstances: HowlInstances = yield select(selectors.audioInstances);

  // Точное совпадение защищает от удаления нового экземпляра с тем же ID.
  const instance: HowlInst = typeof payload === 'string' ? audioInstances[id] : payload.instance;

  if (!instance) {
    return;
  }

  yield put(actions.removeAudioInstance({ id, instance }));

  Object.values(instance.timers).forEach((timer) => {
    if (timer) {
      clearTimeout(timer);
    }
  });

  if (!instance.isUnloading) {
    void unloadAudio(instance);
  }
}

export function* watchActions() {
  yield takeEvery(actions.deleteAudioInstance, watchDeleteAudioInstance);
}
