import type { PayloadAction } from '@reduxjs/toolkit';
import { put, select, takeEvery } from 'redux-saga/effects';

import type { HowlInst, HowlInstances } from '@types';

import { unloadAudio } from '@utils/effects/audio/unloadAudio';

import { actions } from './slice';
import { selectors } from './selectors';

import type { DeleteAudioInstancePayload } from './@types';

type RemoveAudioInstancePayload = {
  id: string;
  instance: NonNullable<HowlInst>;
};

// Обратная совместимость: старые вызовы удаления по ID переводятся в точное удаление экземпляра.
export function* watchDeleteAudioInstance(action: PayloadAction<DeleteAudioInstancePayload>) {
  const { payload } = action;

  const id = typeof payload === 'string' ? payload : payload.id;
  const audioInstances: HowlInstances = yield select(selectors.audioInstances);
  const instance: HowlInst = typeof payload === 'string' ? audioInstances[id] : payload.instance;

  if (!instance) {
    return;
  }

  yield put(actions.removeAudioInstance({ id, instance }));
}

export function* watchRemoveAudioInstance(action: PayloadAction<RemoveAudioInstancePayload>) {
  const { id, instance } = action.payload;
  const audioInstances: HowlInstances = yield select(selectors.audioInstances);

  // Если тот же экземпляр снова зарегистрировали, выгружать его нельзя.
  if (audioInstances[id] === instance) {
    return;
  }

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
  yield takeEvery(actions.removeAudioInstance, watchRemoveAudioInstance);
}
