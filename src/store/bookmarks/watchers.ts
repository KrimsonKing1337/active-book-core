import {
  call,
  select,
  takeLatest,
} from 'redux-saga/effects';

import { mainSelectors } from '@store/main';

import { set as localStorageSet } from '@utils/localStorage/localStorage';

import type { State } from './@types';
import { actions } from './slice';
import { selectors } from './selectors';

function* saveInLocalStorage() {
  const id: string = yield select(mainSelectors.id);
  const bookmarks: State['bookmarks'] = yield select(selectors.bookmarks);

  localStorageSet(id, { bookmarks });
}

export function* watchSetBookmarks() {
  yield call(saveInLocalStorage);
}

export function* watchActions() {
  yield takeLatest(actions.setBookmarks, watchSetBookmarks);
}
