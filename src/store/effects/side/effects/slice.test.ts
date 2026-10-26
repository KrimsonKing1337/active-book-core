import type { SideEffect } from 'hooks/effects/side/@types';

import { actions, initialState, reducer } from './slice';

const firstEffect: SideEffect = {
  id: 'first',
  kind: 'shadow',
  shadow: {
    id: 'glow',
    thickness: 30,
    style: { color: '#ff0000', zIndex: 3 },
    animation: { preset: 'none' },
  },
};

const secondEffect: SideEffect = {
  id: 'second',
  kind: 'shadow',
  shadow: {
    id: 'glow',
    style: { color: '#0000ff' },
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

test('updates one side shadow without changing unrelated effects', () => {
  let state = reducer(initialState, actions.setEffect(firstEffect));
  state = reducer(state, actions.setEffect(secondEffect));
  state = reducer(state, actions.updateShadow({
    effectId: 'first',
    shadowId: 'glow',
    changes: {
      thickness: 50,
      style: { color: '#00ff00' },
    },
  }));

  expect(state.effects.first.shadow?.style).toEqual({
    color: '#00ff00',
    zIndex: 3,
  });

  expect(state.effects.first.shadow?.thickness).toBe(50);
  expect(state.effects.second.shadow?.style?.color).toBe('#0000ff');
  expect(firstEffect.shadow?.style?.color).toBe('#ff0000');
});

test('updates text without touching a separate shadow or the original text', () => {
  let state = reducer(initialState, actions.setEffect(firstEffect));
  state = reducer(state, actions.setEffect(textEffect));

  state = reducer(state, actions.updateText({
    effectId: 'text',
    textId: 'ticker',
    changes: { leftText: 'updated' },
  }));

  expect(state.effects.text.text?.leftText).toBe('updated');
  expect(state.effects.first.shadow?.style?.color).toBe('#ff0000');
  expect(textEffect.text?.leftText).toBe('left');
});

test('ignores updates to unknown effects and items', () => {
  const initial = reducer(initialState, actions.setEffect(firstEffect));
  const missingEffect = reducer(initial, actions.updateShadow({
    effectId: 'absent',
    shadowId: 'glow',
    changes: { hidden: true },
  }));
  const missingShadow = reducer(initial, actions.updateShadow({
    effectId: 'first',
    shadowId: 'absent',
    changes: { hidden: true },
  }));

  expect(missingEffect).toBe(initial);
  expect(missingShadow).toBe(initial);
});
