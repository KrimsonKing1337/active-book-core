import type { SideEffect } from '@hooks/effects/side/@types';

import { actions, initialState, reducer } from './slice';

const shadowEffect: SideEffect = {
  id: 'shadow',
  kind: 'shadow',
  shadow: {
    id: 'glow',
    sides: ['left', 'right'],
    thickness: 30,
  },
};

const textEffect: SideEffect = {
  id: 'text',
  kind: 'text',
  text: {
    id: 'ticker',
    leftText: 'left',
    rightText: 'right',
  },
};

test('registers independent side effects', () => {
  let state = reducer(initialState, actions.setEffect(shadowEffect));

  state = reducer(state, actions.setEffect(textEffect));

  expect(state.effects.shadow).toEqual(shadowEffect);
  expect(state.effects.text).toEqual(textEffect);
});

test('deletes only the requested side effect', () => {
  let state = reducer(initialState, actions.setEffect(shadowEffect));

  state = reducer(state, actions.setEffect(textEffect));
  state = reducer(state, actions.deleteEffect('shadow'));

  expect(state.effects.shadow).toBeUndefined();
  expect(state.effects.text).toEqual(textEffect);
});

test('replaces all side effects when requested', () => {
  const effects = {
    [textEffect.id]: textEffect,
  };

  const state = reducer(initialState, actions.setEffects(effects));

  expect(state.effects).toEqual(effects);
});

test('leaves update commands for the saga', () => {
  const state = reducer(initialState, actions.setEffect(shadowEffect));

  const nextState = reducer(state, actions.updateShadow({
    effectId: 'shadow',
    shadowId: 'glow',
    changes: {
      thickness: 50,
    },
  }));

  expect(nextState).toBe(state);
});

test('keeps masked and unmasked components independent', () => {
  const maskedEffect: SideEffect = {
    id: 'masked',
    kind: 'component',
    frameMask: {
      enabled: true,
      sides: ['bottom'],
    },
  };
  const unmaskedEffect: SideEffect = {
    id: 'unmasked',
    kind: 'component',
    frameMask: {
      enabled: false,
      sides: ['top'],
    },
  };

  let state = reducer(initialState, actions.setEffect(maskedEffect));

  state = reducer(state, actions.setEffect(unmaskedEffect));

  expect(state.effects.masked.frameMask?.sides).toEqual(['bottom']);
  expect(state.effects.unmasked.frameMask?.enabled).toBe(false);
});
