import type { PayloadAction } from '@reduxjs/toolkit';

import { put, select, takeEvery } from 'redux-saga/effects';

import type {
  FrameEffects,
  UpdateFrameShadow,
  UpdateFrameText,
} from './@types';

import { actions } from './slice';
import { selectors } from './selectors';

export function* handleShadowUpdate(action: PayloadAction<UpdateFrameShadow>) {
  const {
    effectId,
    shadowId,
    changes,
  } = action.payload;

  const effects: FrameEffects = yield select(selectors.effects);

  const effect = effects[effectId];
  const shadow = effect?.shadow;

  if (!shadow || shadow.id !== shadowId) {
    return;
  }

  const updatedShadow = {
    ...shadow,
    ...changes,
  };

  if (changes.style) {
    updatedShadow.style = {
      ...shadow.style,
      ...changes.style,
    };
  }

  if (changes.animation) {
    updatedShadow.animation = {
      ...shadow.animation,
      ...changes.animation,
    };
  }

  const updatedEffect = {
    ...effect,
    shadow: updatedShadow,
  };

  yield put(actions.setEffect(updatedEffect));
}

export function* handleTextUpdate(action: PayloadAction<UpdateFrameText>) {
  const {
    effectId,
    textId,
    changes,
  } = action.payload;

  const effects: FrameEffects = yield select(selectors.effects);

  const effect = effects[effectId];
  const text = effect?.text;

  if (!text || text.id !== textId) {
    return;
  }

  const updatedText = {
    ...text,
    ...changes,
  };

  if (changes.style) {
    updatedText.style = {
      ...text.style,
      ...changes.style,
    };
  }

  if (changes.animation) {
    updatedText.animation = {
      ...text.animation,
      ...changes.animation,
    };
  }

  const updatedEffect = {
    ...effect,
    text: updatedText,
  };

  yield put(actions.setEffect(updatedEffect));
}

export function* watchActions() {
  yield takeEvery(actions.updateShadow, handleShadowUpdate);
  yield takeEvery(actions.updateText, handleTextUpdate);
}
