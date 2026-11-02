import { createRef, StrictMode } from 'react';

import { act, render } from '@testing-library/react';

import { StoreProvider, store } from '@store';
import { volumeActions } from '@store/volume';
import { effectsActions } from '@store/effects/common';

import { Video } from './Video';

test('volume edits keep the element and playback position; StrictMode subscriptions are cleaned', () => {
  const active = new Set<EventListenerOrEventListenerObject>();
  const add = HTMLMediaElement.prototype.addEventListener;
  const remove = HTMLMediaElement.prototype.removeEventListener;
  const addSpy = jest.spyOn(HTMLMediaElement.prototype, 'addEventListener').mockImplementation(function (
    this: HTMLMediaElement, name, listener, options,
  ) {
    if (name === 'timeupdate' && typeof listener === 'function' && listener.name === 'handleTimeUpdate') {
      active.add(listener);
    }
    add.call(this, name, listener, options);
  });
  const removeSpy = jest.spyOn(HTMLMediaElement.prototype, 'removeEventListener').mockImplementation(function (
    this: HTMLMediaElement, name, listener, options,
  ) {
    active.delete(listener);
    remove.call(this, name, listener, options);
  });
  const ref = createRef<HTMLVideoElement>();
  store.dispatch(effectsActions.setVideoCurrentTime({ id: 'volume-test', currentTime: 0 }));
  store.dispatch(volumeActions.setGlobal(100));
  store.dispatch(volumeActions.setVideos(100));
  const view = (relativeVolume: number) => (
    <StrictMode>
      <StoreProvider>
        <Video
          elementRef={ref}
          id="volume-test"
          src="movie.webm"
          relativeVolume={relativeVolume}
        />
      </StoreProvider>
    </StrictMode>
  );
  const { rerender, unmount } = render(view(100));
  const element = ref.current!;
  expect(active.size).toBe(1);
  element.currentTime = 12;
  act(() => {
    store.dispatch(volumeActions.setGlobal(50));
    store.dispatch(volumeActions.setVideos(40));
  });
  expect(element.volume).toBeCloseTo(0.2);
  rerender(view(50));
  expect(ref.current).toBe(element);
  expect(element.currentTime).toBe(12);
  expect(element.volume).toBeCloseTo(0.1);
  expect(active.size).toBe(1);
  act(() => element.dispatchEvent(new Event('timeupdate')));
  unmount();
  expect(active.size).toBe(0);
  expect(store.getState().effects.videosCurrentTime['volume-test']).toBe(12);
  addSpy.mockRestore();
  removeSpy.mockRestore();
});
