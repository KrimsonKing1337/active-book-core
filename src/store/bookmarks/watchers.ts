import { call, put, select, takeLatest } from 'redux-saga/effects';

import { mainActions, mainSelectors } from '@store/main';

import { set as localStorageSet } from '@utils/localStorage/localStorage';

import { State } from './@types';
import { actions } from './slice';
import { selectors } from './selectors';

function* saveInLocalStorage() {
  const id: string = yield select(mainSelectors.id);
  const bookmarks: State = yield select(selectors.bookmarks);

  localStorageSet(id, { bookmarks });
}

export function* watchSetBookmarks() {
  yield call(saveInLocalStorage);
}

function* closeMenu(action: ReturnType<typeof actions.setIsOpen>) {
  if (action.payload) {
    yield put(mainActions.setMenuActiveState(null));
  }
}

export function* watchActions() {
  yield takeLatest(actions.setIsOpen, closeMenu);
  yield takeLatest(actions.setBookmarks, watchSetBookmarks);
}
