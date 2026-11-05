import { store } from '@store';

import { actions, initialState, reducer } from './slice';
import { selectors } from './selectors';

test('one stable page ID survives reorder; numeric positions are only a navigation input', () => {
  let state = reducer(initialState, actions.setStoryPages(['alpha', 'beta', 'gamma']));
  state = reducer(state, actions.setPage('beta'));
  state = reducer(state, actions.setStoryPages(['beta', 'gamma', 'alpha']));
  expect(state.pageId).toBe('beta');
  expect(selectors.page({ ...store.getState(), main: state })).toBe(1);
  expect(reducer(state, actions.setPage(9)).pageId).toBe('beta');
  expect(reducer(state, actions.setPage('unknown')).pageId).toBe('beta');
  state = reducer(state, actions.setPage(2));
  expect(state.pageId).toBe('gamma');
  state = reducer(state, actions.setStoryPages(['beta', 'alpha']));
  expect(state.pageId).toBe('beta');
  expect(reducer(state, actions.setPage(0)).pageId).toBeNull();
});
