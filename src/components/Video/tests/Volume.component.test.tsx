import {
  createRef,
  StrictMode,
} from 'react';

import {
  act,
  cleanup,
  render,
} from '@testing-library/react';

import { StoreProvider, store } from '@store';
import { volumeActions } from '@store/volume';
import { initialState } from '@store/volume/slice';
import { volumeCases } from '@store/volume/tests/volumeFixture';

import { setMuteToAllVideos } from '@components/AppWrapper/utils';

import { Video } from '../Video';

import { installMedia } from './media';

beforeEach(() => {
  jest.useFakeTimers();
  installMedia();
  jest.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  store.dispatch(volumeActions.setAll(initialState));
});

afterEach(async () => {
  await act(async () => {
    cleanup();
    await jest.advanceTimersByTimeAsync(0);
  });
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('StrictMode video uses the same matrix on mount, rerender and recreation without stale writes', async () => {
  const ref = createRef<HTMLVideoElement>();
  const view = (relative: number) => (
    <StrictMode>
      <StoreProvider>
        <Video
          elementRef={ref}
          id="volume-matrix"
          src="movie.webm"
          relativeVolume={relative}
          autoPlay={false}
        />
      </StoreProvider>
    </StrictMode>
  );
  const { rerender, unmount } = render(view(100));
  const element = ref.current;

  if (!element) {
    throw new Error('Missing video');
  }

  element.currentTime = 12;

  for (const factors of volumeCases) {
    const {
      global,
      category,
      relative,
    } = factors;
    act(() => store.dispatch(volumeActions.setAll({
      ...initialState,
      global,
      videos: category,
    })));
    rerender(view(relative));
    const expected = global * category * relative / 1_000_000;
    expect(ref.current).toBe(element);
    expect(element.currentTime).toBe(12);
    expect(element.volume).toBeCloseTo(expected, 12);
    setMuteToAllVideos(true);
    setMuteToAllVideos(false);
    expect(element.volume).toBeCloseTo(expected, 12);
  }

  unmount();
  await act(async () => jest.advanceTimersByTimeAsync(0));
  const finalVolume = element.volume;
  act(() => store.dispatch(volumeActions.setGlobal(25)));
  render(view(0));
  expect(ref.current).not.toBe(element);
  expect(ref.current?.volume).toBe(0);
  expect(element.volume).toBe(finalVolume);
});

test('hidden video mounts and rerenders silently, then restores the current mixer settings', () => {
  jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  store.dispatch(volumeActions.setGlobal(50));
  store.dispatch(volumeActions.setVideos(50));
  const { container, rerender } = render(
    <StoreProvider>
      <Video
        id="hidden-volume"
        src="movie.webm"
        relativeVolume={50}
        autoPlay={false}
      />
    </StoreProvider>,
  );
  const element = container.querySelector('video');
  expect(element?.volume).toBe(0);
  rerender(
    <StoreProvider>
      <Video
        id="hidden-volume"
        src="movie.webm"
        relativeVolume={25}
        autoPlay={false}
      />
    </StoreProvider>,
  );
  expect(element?.volume).toBe(0);
  jest.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  setMuteToAllVideos(false);
  expect(element?.volume).toBe(0.0625);
});
