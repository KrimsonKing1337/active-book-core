import type { Task } from 'redux-saga';

import {
  put,
  delay,
  fork,
  select,
  take,
  cancel,
} from 'redux-saga/effects';

import { actions } from './slice';
import { selectors } from './selectors';

function* showAfterDelay(ms: number) {
  yield delay(ms);

  const isPending: boolean = yield select(selectors.isPending);

  if (isPending) {
    yield put(actions.setShowLoader(true));
  }
}

function* hideAfterDelay(ms: number) {
  yield delay(ms);

  const isPending: boolean = yield select(selectors.isPending);

  if (!isPending) {
    yield put(actions.setShowLoader(false));
  }
}

export function* watchLoaderGate() {
  let showTask: Task | null = null;
  let hideTask: Task | null = null;

  while (true) {
    if (showTask && !showTask.isRunning()) {
      showTask = null;
    }

    if (hideTask && !hideTask.isRunning()) {
      hideTask = null;
    }

    yield take([
      actions.openBookSession.type,
      actions.closeBookSession.type,
      actions.setPage.type,
      actions.setStoryPages.type,
      actions.setPrimaryCommitted.type,
      actions.registerPageResource.type,
      actions.settlePageResource.type,
    ]);

    const isPending: boolean = yield select(selectors.isPending);
    const showLoader: boolean = yield select(selectors.showLoader);

    if (isPending) {
      // если pending снова true — отменяем скрытие
      if (hideTask) {
        yield cancel(hideTask);

        hideTask = null;
      }

      // если ещё не показали — планируем показ
      if (!showLoader && !showTask) {
        showTask = yield fork(showAfterDelay, 250);
      }

    } else {
      // pending false — отменяем показ, если он ещё не случился
      if (showTask) {
        yield cancel(showTask);

        showTask = null;
      }

      // если лоадер уже показан — скрываем с задержкой (антифликер)
      if (showLoader && !hideTask) {
        hideTask = yield fork(hideAfterDelay, 200);
      }
    }
  }
}

export function* watchActions() {
  yield fork(watchLoaderGate);
}
