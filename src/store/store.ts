import { createContext } from 'react';

import type { ReactReduxContextValue } from 'react-redux';

import {
  createStoreHook,
  createDispatchHook,
  createSelectorHook,
} from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';

import createSagaMiddleware from 'redux-saga';

import { mainReducer, watchMainActions } from './main';
import { configReducer, watchConfigActions } from './config';
import { volumeReducer, watchVolumeActions } from './volume';
import { effectsReducer, watchEffectsActions } from './effects/common';
import { fontEffectsReducer } from './effects/font';
import { audioEffectsReducer, watchAudioEffectsActions } from './effects/audio/audio';
import { audioBgEffectsReducer, watchAudioBgEffectsActions } from './effects/audio/audioBg';
import { bookmarksReducer, watchBookmarksActions } from './bookmarks';
import { segmentsReducer, watchSegmentsActions } from './segments';

import { counterReducer, watchCounterActions } from './counter';
import { windowsReducer } from './windows';

const sagaMiddleware = createSagaMiddleware();

const reducer = {
  main: mainReducer,
  config: configReducer,
  volume: volumeReducer,
  effects: effectsReducer,
  audioEffects: audioEffectsReducer,
  audioBgEffects: audioBgEffectsReducer,
  fontEffects: fontEffectsReducer,
  bookmarks: bookmarksReducer,
  segments: segmentsReducer,

  counter: counterReducer,
  windows: windowsReducer,
};

const middleware = [
  sagaMiddleware,
];

export const store = configureStore({
  reducer,

  middleware: (getDefaultMiddleware) => {
    const defaultMiddleware = getDefaultMiddleware({
      serializableCheck: false,
    });

    return defaultMiddleware.concat(middleware);
  },

  devTools: process.env.mode !== 'production',
});

sagaMiddleware.run(watchConfigActions);
sagaMiddleware.run(watchMainActions);
sagaMiddleware.run(watchEffectsActions);
sagaMiddleware.run(watchAudioEffectsActions);
sagaMiddleware.run(watchAudioBgEffectsActions);
sagaMiddleware.run(watchBookmarksActions);
sagaMiddleware.run(watchVolumeActions);
sagaMiddleware.run(watchSegmentsActions);

sagaMiddleware.run(watchCounterActions);

export type RootState = ReturnType<typeof store.getState>;
export type StoreContext = ReactReduxContextValue<RootState> | null;

export const storeContext = createContext<StoreContext>(null);

export const useStore = createStoreHook(storeContext);
export const useDispatch = createDispatchHook(storeContext);
export const useSelector = createSelectorHook(storeContext);
