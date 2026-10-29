import type { FrameEffect } from '@hooks/effects/frame/@types';

import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import { actions, reducer } from './slice';
import { watchActions } from './watchers';

const firstEffect: FrameEffect = {
  id: 'first',
  kind: 'shadow',
  shadow: {
    id: 'glow',
    sides: ['left', 'right'],
    thickness: 30,
    style: {
      color: '#ff0000',
      zIndex: 3,
    },
    animation: {
      preset: 'none',
      duration: 1000,
    },
  },
};

const secondEffect: FrameEffect = {
  id: 'second',
  kind: 'shadow',
  shadow: {
    id: 'glow',
    sides: ['bottom'],
    style: {
      color: '#0000ff',
    },
  },
};

const textEffect: FrameEffect = {
  id: 'text',
  kind: 'text',
  text: {
    id: 'ticker',
    leftText: 'left',
    rightText: 'right',
    animation: {
      preset: 'scroll',
      duration: 2000,
    },
  },
};

const createTestStore = () => {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: {
      frameEffects: reducer,
    },
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(sagaMiddleware);
    },
  });

  sagaMiddleware.run(watchActions);

  return store;
};

test('merges shadow styles and animations without touching other effects', () => {
  const store = createTestStore();

  store.dispatch(actions.setEffect(firstEffect));
  store.dispatch(actions.setEffect(secondEffect));

  store.dispatch(actions.updateShadow({
    effectId: 'first',
    shadowId: 'glow',
    changes: {
      thickness: 50,
      style: {
        color: '#00ff00',
      },
      animation: {
        duration: 500,
      },
    },
  }));

  const effects = store.getState().frameEffects.effects;

  expect(effects.first.shadow?.thickness).toBe(50);
  expect(effects.first.shadow?.style).toEqual({
    color: '#00ff00',
    zIndex: 3,
  });
  expect(effects.first.shadow?.animation).toEqual({
    preset: 'none',
    duration: 500,
  });

  expect(effects.second.shadow?.style?.color).toBe('#0000ff');
  expect(firstEffect.shadow?.style?.color).toBe('#ff0000');
});

test('updates text independently and preserves its remaining options', () => {
  const store = createTestStore();

  store.dispatch(actions.setEffect(firstEffect));
  store.dispatch(actions.setEffect(textEffect));

  store.dispatch(actions.updateText({
    effectId: 'text',
    textId: 'ticker',
    changes: {
      leftText: 'updated',
      animation: {
        duration: 500,
      },
    },
  }));

  const effects = store.getState().frameEffects.effects;

  expect(effects.text.text?.leftText).toBe('updated');
  expect(effects.text.text?.rightText).toBe('right');
  expect(effects.text.text?.animation).toEqual({
    preset: 'scroll',
    duration: 500,
  });

  expect(effects.first.shadow?.style?.color).toBe('#ff0000');
  expect(textEffect.text?.leftText).toBe('left');
});

test('ignores requests with unknown effect or item IDs', () => {
  const store = createTestStore();

  store.dispatch(actions.setEffect(firstEffect));

  const originalState = store.getState().frameEffects;

  store.dispatch(actions.updateShadow({
    effectId: 'absent',
    shadowId: 'glow',
    changes: {
      hidden: true,
    },
  }));

  store.dispatch(actions.updateShadow({
    effectId: 'first',
    shadowId: 'absent',
    changes: {
      hidden: true,
    },
  }));

  store.dispatch(actions.updateText({
    effectId: 'first',
    textId: 'absent',
    changes: {
      leftText: 'new',
    },
  }));

  expect(store.getState().frameEffects).toBe(originalState);
});
