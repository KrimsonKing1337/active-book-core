import {
  act,
  cleanup,
  render,
} from '@testing-library/react';

import { store } from '@store';

import { finishMedia, installMedia } from './media';
import {
  preparePage,
  presentPage,
  resetReadiness,
  videoSession,
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

test('autoplay waits for reader readiness and StrictMode starts once', async () => {
  preparePage();
  const { rerender } = render(videoView({ session: videoSession }));
  expect(media.play).not.toHaveBeenCalled();
  await act(async () => presentPage());
  expect(media.play).toHaveBeenCalledTimes(1);
  rerender(videoView({ session: videoSession }));
  expect(media.play).toHaveBeenCalledTimes(1);
});

test('inactive slides cannot start, including an external play attempt', async () => {
  render(videoView({ active: false }));
  expect(media.play).not.toHaveBeenCalled();
  const video = videoElement();
  await act(async () => {
    await video.play();
  });
  expect(video.paused).toBe(true);
});

test('deactivation preserves time and playing intent; activation resumes', async () => {
  const { rerender } = render(videoView());
  const video = videoElement();
  video.currentTime = 12;
  await act(async () => rerender(videoView({ active: false })));
  expect(video.paused).toBe(true);
  expect(video.currentTime).toBe(12);
  await act(async () => rerender(videoView()));
  expect(videoElement()).toBe(video);
  expect(video.paused).toBe(false);
  expect(video.currentTime).toBe(12);
  expect(media.play).toHaveBeenCalledTimes(2);
});

test('a manual pause persists through deactivation, activation and rerender', async () => {
  const { rerender } = render(videoView());
  const video = videoElement();
  await act(async () => video.pause());
  await act(async () => rerender(videoView({ active: false })));
  await act(async () => rerender(videoView()));
  rerender(videoView());
  expect(video.paused).toBe(true);
  expect(media.play).toHaveBeenCalledTimes(1);
});

test('a pause still wins when slide changes happen before the native pause event', async () => {
  const { rerender } = render(videoView());
  const video = videoElement();
  video.pause();
  rerender(videoView({ active: false }));
  rerender(videoView());
  await act(async () => {});
  expect(video.paused).toBe(true);
  expect(media.play).toHaveBeenCalledTimes(1);
});

test('autoPlay=false waits for manual start and resumes that start on return', async () => {
  const { rerender } = render(videoView({ autoPlay: false }));
  const video = videoElement();
  expect(media.play).not.toHaveBeenCalled();
  await act(async () => {
    await video.play();
  });
  await act(async () => rerender(videoView({ autoPlay: false, active: false })));
  await act(async () => rerender(videoView({ autoPlay: false })));
  expect(video.paused).toBe(false);
  expect(media.play).toHaveBeenCalledTimes(2);
});

test('natural completion is not replayed by returning to the slide', async () => {
  const { rerender } = render(videoView());
  const video = videoElement();
  act(() => finishMedia(video));
  await act(async () => rerender(videoView({ active: false })));
  await act(async () => rerender(videoView()));
  expect(video.ended).toBe(true);
  expect(media.play).toHaveBeenCalledTimes(1);
});

test('source replacement starts a new intent and never restores the old cached time', async () => {
  const { rerender } = render(videoView());
  const video = videoElement();
  video.currentTime = 7;
  act(() => video.dispatchEvent(new Event('timeupdate')));
  await act(async () => video.pause());
  await act(async () => rerender(videoView({ src: 'second.webm' })));
  expect(video.currentTime).toBe(0);
  expect(video.paused).toBe(false);
  expect(store.getState().effects.videosCurrentTime['playback-test']).toBe(0);
  expect(media.play).toHaveBeenCalledTimes(2);
});

test('final dialog disposal resets and releases; StrictMode replay does neither', async () => {
  const { rerender, unmount } = render(videoView({ dialog: true }));
  const video = videoElement();
  video.currentTime = 8;
  rerender(videoView({ dialog: true }));
  expect(video.currentTime).toBe(8);
  expect(media.play).toHaveBeenCalledTimes(1);
  expect(media.load).not.toHaveBeenCalled();
  await act(async () => unmount());
  expect(video.paused).toBe(true);
  expect(video.currentTime).toBe(0);
  expect(video.hasAttribute('src')).toBe(false);
  expect(media.load).toHaveBeenCalledTimes(1);
});
