import {
  act,
  cleanup,
  renderHook,
} from '@testing-library/react';

import { StoreProvider, store } from '@store';
import { mainActions } from '@store/main';
import { effectsActions } from '@store/effects/common';

import { useDeleteAllVideosWithoutDataIdOnThePage } from '../hooks';

let media: HTMLDivElement;

const setVideoIds = (ids: (string | null)[]) => {
  media.replaceChildren();

  for (const id of ids) {
    const video = document.createElement('video');

    if (id !== null) {
      video.setAttribute('data-id', id);
    }

    media.append(video);
  }
};

beforeEach(() => {
  store.dispatch(mainActions.setStoryPages(['first', 'second']));
  store.dispatch(mainActions.setPage(1));
  store.dispatch(effectsActions.setVideosCurrentTime({}));
  media = document.createElement('div');
  document.body.append(media);
});

afterEach(() => {
  cleanup();
  media.remove();
});

test('retains matching positions and zero without writing to a frozen Redux snapshot', () => {
  const saved = {
    kept: 7,
    zero: 0,
    removed: 11,
  };
  store.dispatch(effectsActions.setVideosCurrentTime(saved));
  expect(Object.isFrozen(saved)).toBe(true);
  setVideoIds([
    'kept',
    'kept',
    'zero',
    'uncached',
    '',
    null,
  ]);

  renderHook(useDeleteAllVideosWithoutDataIdOnThePage, { wrapper: StoreProvider });

  const current = store.getState().effects.videosCurrentTime;
  expect(current).toEqual({ kept: 7, zero: 0 });
  expect(current).not.toBe(saved);
  expect(saved).toEqual({
    kept: 7,
    zero: 0,
    removed: 11,
  });
});

test('keeps an explicitly saved zero instead of treating it as a missing position', () => {
  store.dispatch(effectsActions.setVideosCurrentTime({ zero: 0 }));
  setVideoIds(['zero']);
  renderHook(useDeleteAllVideosWithoutDataIdOnThePage, { wrapper: StoreProvider });
  expect(store.getState().effects.videosCurrentTime).toEqual({ zero: 0 });
});

test('uses the latest saved values and only prunes when the page changes', () => {
  setVideoIds(['shared']);
  renderHook(useDeleteAllVideosWithoutDataIdOnThePage, { wrapper: StoreProvider });
  act(() => store.dispatch(effectsActions.setVideosCurrentTime({ shared: 9, removed: 4 })));
  expect(store.getState().effects.videosCurrentTime).toEqual({ shared: 9, removed: 4 });
  act(() => store.dispatch(mainActions.setPage(2)));
  expect(store.getState().effects.videosCurrentTime).toEqual({ shared: 9 });
  act(() => store.dispatch(effectsActions.setVideoCurrentTime({ id: 'shared', currentTime: 0 })));
  act(() => store.dispatch(mainActions.setPage(1)));
  expect(store.getState().effects.videosCurrentTime).toEqual({ shared: 0 });
});

test('removes absent IDs on navigation and does not recreate their cache when returning', () => {
  setVideoIds(['first']);
  renderHook(useDeleteAllVideosWithoutDataIdOnThePage, { wrapper: StoreProvider });
  act(() => store.dispatch(effectsActions.setVideoCurrentTime({ id: 'first', currentTime: 5 })));
  setVideoIds(['second']);
  act(() => store.dispatch(mainActions.setPage(2)));
  expect(store.getState().effects.videosCurrentTime).toEqual({});
  setVideoIds(['first']);
  act(() => store.dispatch(mainActions.setPage(1)));
  expect(store.getState().effects.videosCurrentTime).toEqual({});
});
