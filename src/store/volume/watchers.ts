import type { PayloadAction } from '@reduxjs/toolkit';

import {
  call,
  put,
  select,
  takeLatest,
} from 'redux-saga/effects';

import type { AudioType } from '@types';

import { store } from '@store';

import { setVideosVolume } from '@utils/volume/setVideosVolume';

import type { State } from './@types';

import { actions } from './slice';
import { selectors } from './selectors';


const setAudioVolumeByType = (type: AudioType, volume: number) => {
  const { audioInstances } = store.getState().audioEffects;

  Object.values(audioInstances).forEach((audioInstanceCur) => {
    if (!audioInstanceCur) {
      return;
    }

    if (audioInstanceCur.type === type) {
      audioInstanceCur.volume(volume / 100);
    }
  });
};

export function* watchSetAll(action: PayloadAction<State>) {
  const { payload } = action;

  const {
    global,
    bg,
    music,
    sfx,
    videos,
  } = payload;

  yield put(actions.setSfx(sfx));
  yield put(actions.setMusic(music));
  yield put(actions.setBg(bg));
  yield put(actions.setVideos(videos));

  // Обновляем категории, затем синхронизируем ресурсы с общей громкостью.
  yield put(actions.setGlobal(global));
}

export function* watchSetGlobal() {
  const volumeAll: State = yield select(selectors.all);

  const {
    sfx,
    bg,
    music,
    videos,
  } = volumeAll;

  yield call(() => {
    setAudioVolumeByType('sfx', sfx);
    setAudioVolumeByType('bg', bg);
    setAudioVolumeByType('music', music);

    setVideosVolume(videos);
  });
}

export function* watchSetBg(action: PayloadAction<State['bg']>) {
  const { payload } = action;

  yield call(() => {
    setAudioVolumeByType('bg', payload);
  });
}

export function* watchSetSfx(action: PayloadAction<State['sfx']>) {
  const { payload } = action;

  yield call(() => {
    setAudioVolumeByType('sfx', payload);
  });
}

export function* watchSetMusic(action: PayloadAction<State['music']>) {
  const { payload } = action;

  yield call(() => {
    setAudioVolumeByType('music', payload);
  });
}

export function* watchSetVideos(action: PayloadAction<State['videos']>) {
  const { payload } = action;

  yield call(() => {
    setVideosVolume(payload);
  });
}

export function* watchActions() {
  yield takeLatest(actions.setAll, watchSetAll);
  yield takeLatest(actions.setGlobal, watchSetGlobal);
  yield takeLatest(actions.setBg, watchSetBg);
  yield takeLatest(actions.setSfx, watchSetSfx);
  yield takeLatest(actions.setMusic, watchSetMusic);
  yield takeLatest(actions.setVideos, watchSetVideos);
}
