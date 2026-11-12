import { store } from '../../src/store';
import { mainActions } from '../../src/store/main';

type FixtureApi = {
  open: (contentId: string, canClose?: boolean) => string;
  requestClose: (instanceId: string) => void;
  forceClose: (instanceId: string) => void;
  captureCallbacks: () => void;
  lateClose: () => void;
  lateForceClose: () => void;
  lateOpen: () => void;
  setVisible: (visible: boolean) => void;
  renew: () => void;
  go: (page: string | number) => void;
  getState: () => ReturnType<typeof store.getState>['windows'];
};

declare global {
  interface Window {
    windowFixture: FixtureApi;
  }
}

const notReady = (): never => {
  throw new Error('Window fixture is not ready');
};

export const api: FixtureApi = {
  open: notReady,
  requestClose: notReady,
  forceClose: notReady,
  captureCallbacks: notReady,
  lateClose: notReady,
  lateForceClose: notReady,
  lateOpen: notReady,
  setVisible: notReady,
  renew: notReady,
  go: (page) => store.dispatch(mainActions.setPage(page)),
  getState: () => store.getState().windows,
};

window.windowFixture = api;
