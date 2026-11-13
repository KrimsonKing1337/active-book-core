import {
  act,
  cleanup,
  render,
} from '@testing-library/react';

import { store } from '@store';
import { effectsActions } from '@store/effects/common';

import {
  deferred,
  installMedia,
  startMedia,
} from './media';
import {
  resetReadiness,
  videoElement,
  videoView,
} from './view';

let media: ReturnType<typeof installMedia>;

beforeEach(() => {
  media = installMedia();
  resetReadiness();
});

afterEach(async () => {
  await act(async () => cleanup());
  jest.restoreAllMocks();
});

test('pending play after final close cannot revive or seek the old dialog', async () => {
  const pending = deferred();
  media.play.mockImplementationOnce(function (this: HTMLMediaElement) {
    return startMedia(this, pending.promise);
  });
  const { unmount } = render(videoView({ dialog: true }));
  const video = videoElement();
  video.currentTime = 5;
  await act(async () => unmount());
  await act(async () => pending.resolve());
  expect(video.paused).toBe(true);
  expect(video.currentTime).toBe(0);
  expect(video.hasAttribute('src')).toBe(false);
  expect(media.play).toHaveBeenCalledTimes(1);
});

test('current-window guard is checked again when play settles', async () => {
  let current = true;
  const pending = deferred();
  media.play.mockImplementationOnce(function (this: HTMLMediaElement) {
    return startMedia(this, pending.promise);
  });
  render(videoView({ dialog: true, isCurrentWindow: () => current }));
  const video = videoElement();
  current = false;
  await act(async () => pending.resolve());
  expect(video.paused).toBe(true);
});

test('a retired metadata listener cannot restore time into a replacement source', () => {
  store.dispatch(effectsActions.setVideoCurrentTime({ id: 'playback-test', currentTime: 9 }));
  const add = jest.spyOn(HTMLMediaElement.prototype, 'addEventListener');
  const { rerender } = render(videoView({ autoPlay: false }));
  const metadata = add.mock.calls.find(([name]) => name === 'loadedmetadata');
  expect(metadata).toBeDefined();
  rerender(videoView({ autoPlay: false, src: 'second.webm' }));
  const video = videoElement();

  if (metadata && typeof metadata[1] === 'function') {
    metadata[1].call(video, new Event('loadedmetadata'));
  }

  expect(video.currentTime).toBe(0);
});

test('a retired play listener cannot pause the replacement source', async () => {
  const add = jest.spyOn(HTMLMediaElement.prototype, 'addEventListener');
  const { rerender } = render(videoView());
  const oldPlay = add.mock.calls.find(([name, listener]) => {
    return name === 'play' && typeof listener === 'function' && listener.name === 'handlePlay';
  });
  await act(async () => rerender(videoView({ src: 'second.webm' })));
  const video = videoElement();

  if (oldPlay && typeof oldPlay[1] === 'function') {
    oldPlay[1].call(video, new Event('play'));
  }

  expect(oldPlay).toBeDefined();
  expect(video.paused).toBe(false);
});

test('StrictMode leaves exactly one set of playback listeners and removes it on unmount', async () => {
  const active = new Set<EventListenerOrEventListenerObject>();
  const names = new Set([
    'handlePlay',
    'handlePause',
    'handleEnded',
    'handleTimeUpdate',
  ]);
  const prototype = HTMLMediaElement.prototype;
  const add = prototype.addEventListener;
  const remove = prototype.removeEventListener;
  jest.spyOn(prototype, 'addEventListener').mockImplementation(function (
    this: HTMLMediaElement, ...args: Parameters<HTMLMediaElement['addEventListener']>
  ) {
    const listener = args[1];

    if (typeof listener === 'function' && names.has(listener.name)) {
      active.add(listener);
    }

    add.apply(this, args);
  });
  jest.spyOn(prototype, 'removeEventListener').mockImplementation(function (
    this: HTMLMediaElement, ...args: Parameters<HTMLMediaElement['removeEventListener']>
  ) {
    active.delete(args[1]);
    remove.apply(this, args);
  });
  const { unmount } = render(videoView());
  expect(active.size).toBe(4);
  expect(media.play).toHaveBeenCalledTimes(1);
  expect(videoElement().hasAttribute('src')).toBe(true);
  await act(async () => unmount());
  expect(active.size).toBe(0);
});
