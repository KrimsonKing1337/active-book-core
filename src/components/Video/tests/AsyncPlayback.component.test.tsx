import {
  act,
  cleanup,
  render,
} from '@testing-library/react';

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

test('pending play cannot revive a deactivated slide', async () => {
  const pending = deferred();
  media.play.mockImplementationOnce(function (this: HTMLMediaElement) {
    return startMedia(this, pending.promise);
  });
  const { rerender } = render(videoView());
  const video = videoElement();
  await act(async () => rerender(videoView({ active: false })));
  await act(async () => pending.resolve());
  expect(video.paused).toBe(true);
  expect(media.play).toHaveBeenCalledTimes(1);
});

test('manual pause cancels pending autoplay intent', async () => {
  const pending = deferred();
  media.play.mockImplementationOnce(function (this: HTMLMediaElement) {
    return startMedia(this, pending.promise);
  });
  const { rerender } = render(videoView());
  const video = videoElement();
  await act(async () => video.pause());
  await act(async () => pending.resolve());
  await act(async () => rerender(videoView({ active: false })));
  await act(async () => rerender(videoView()));
  expect(video.paused).toBe(true);
  expect(media.play).toHaveBeenCalledTimes(1);
});

test('an old rejection cannot cancel the new source or change its controls', async () => {
  const pending = deferred();
  media.play.mockImplementationOnce(function (this: HTMLMediaElement) {
    return startMedia(this, pending.promise);
  });
  const { rerender } = render(videoView());
  await act(async () => rerender(videoView({ src: 'second.webm' })));
  const video = videoElement();
  video.currentTime = 3;
  await act(async () => pending.reject(new DOMException('Old source', 'NotAllowedError')));
  expect(video.paused).toBe(false);
  expect(video.controls).toBe(false);
  expect(video.currentTime).toBe(3);
  expect(media.play).toHaveBeenCalledTimes(2);
});

test('an old fulfillment cannot touch the new source or restart an unmounted dialog', async () => {
  const pending = deferred();
  media.play.mockImplementationOnce(function (this: HTMLMediaElement) {
    return startMedia(this, pending.promise);
  });
  const { rerender, unmount } = render(videoView({ dialog: true }));
  await act(async () => rerender(videoView({ dialog: true, src: 'second.webm' })));
  const video = videoElement();
  video.currentTime = 4;
  await act(async () => pending.resolve());
  expect(video.currentTime).toBe(4);
  expect(video.paused).toBe(false);
  await act(async () => unmount());
  expect(video.currentTime).toBe(0);
  expect(video.paused).toBe(true);
});

test('NotAllowedError exposes controls and waits for manual play', async () => {
  media.play.mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'));
  const { rerender } = render(videoView());
  await act(async () => {});
  const video = videoElement();
  expect(video.controls).toBe(true);
  await act(async () => rerender(videoView({ active: false })));
  await act(async () => rerender(videoView()));
  expect(media.play).toHaveBeenCalledTimes(1);
  await act(async () => {
    await video.play();
  });
  expect(video.paused).toBe(false);
});

test('a retired permission rejection cannot erase a newer manual play intent', async () => {
  const pending = deferred();
  media.play.mockImplementationOnce(() => pending.promise);
  const { rerender } = render(videoView());
  const video = videoElement();
  await act(async () => {
    await video.play();
  });
  await act(async () => pending.reject(new DOMException('Old permission', 'NotAllowedError')));
  expect(video.controls).toBe(false);
  await act(async () => rerender(videoView({ active: false })));
  await act(async () => rerender(videoView()));
  expect(video.paused).toBe(false);
  expect(media.play).toHaveBeenCalledTimes(3);
});

test('AbortError is expected; other current play errors are reported', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  media.play.mockRejectedValueOnce(new DOMException('Interrupted', 'AbortError'));
  const { rerender } = render(videoView());
  await act(async () => {});
  expect(warn).not.toHaveBeenCalled();
  const failure = new Error('Decoder failed');
  media.play.mockRejectedValueOnce(failure);
  await act(async () => rerender(videoView({ src: 'broken.webm' })));
  expect(warn).toHaveBeenCalledWith('Video could not start', 'broken.webm', failure);
});
