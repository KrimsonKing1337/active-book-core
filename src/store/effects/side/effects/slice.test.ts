import type { SideEffect } from 'hooks/effects/side/@types';

import { actions, initialState, reducer } from './slice';

const firstEffect: SideEffect = {
  id: 'first',
  shadows: [{
    id: 'glow',
    thickness: 30,
    style: { color: '#ff0000', zIndex: 3 },
    animation: { preset: 'none' },
  }],
  texts: [{
    id: 'ticker',
    leftText: 'left',
    rightText: 'right',
  }],
};

const secondEffect: SideEffect = {
  id: 'second',
  shadows: [{
    id: 'glow',
    style: { color: '#0000ff' },
  }],
};

test('updates one shadow by effect ID without replacing unrelated styles or other effects', () => {
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

  expect(state.effects.first.shadows?.[0].style).toEqual({
    color: '#00ff00',
    zIndex: 3,
  });

  expect(state.effects.first.shadows?.[0].thickness).toBe(50);
  expect(state.effects.second.shadows?.[0].style?.color).toBe('#0000ff');
  expect(firstEffect.shadows?.[0].style?.color).toBe('#ff0000');
});

test('updates text without touching the shadow or the original book options', () => {
  let state = reducer(initialState, actions.setEffect(firstEffect));

  state = reducer(state, actions.updateText({
    effectId: 'first',
    textId: 'ticker',
    changes: { leftText: 'updated' },
  }));

  expect(state.effects.first.texts?.[0].leftText).toBe('updated');
  expect(state.effects.first.shadows?.[0].style?.color).toBe('#ff0000');
  expect(firstEffect.texts?.[0].leftText).toBe('left');
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
