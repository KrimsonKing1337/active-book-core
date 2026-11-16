import type { PropsWithChildren } from 'react';

import { StrictMode } from 'react';

import {
  act,
  cleanup,
  renderHook,
} from '@testing-library/react';
import { Howl } from 'howler';

import { StoreProvider, store } from '@store';
import { mainActions } from '@store/main';
import { audioEffectsActions } from '@store/effects/audio/audio';

import { useAudio } from '@hooks/effects/audio/useAudio';

import { installHowlerFixture } from './howlerFixture';

let fixture: ReturnType<typeof installHowlerFixture>;

const wrapper = ({ children }: PropsWithChildren) => (
  <StrictMode>
    <StoreProvider>
      {children}
    </StoreProvider>
  </StrictMode>
);

beforeEach(() => {
  fixture = installHowlerFixture();
  store.dispatch(mainActions.setStoryPages(['first', 'second']));
  store.dispatch(mainActions.setPage(1));
  store.dispatch(mainActions.setIsAudioUnlocked(true));
});

afterEach(async () => {
  await act(async () => cleanup());
  fixture.restore();
});

test('StrictMode replacement and stale cleanup cannot restart or remove the wrong instance', async () => {
  const {
    result,
    rerender,
    unmount,
  } = renderHook(({ src }) => useAudio({
    id: 'replaceable-audio',
    page: 1,
    src,
    delay: 100,
    fadeOutWhenUnload: false,
  }), { wrapper, initialProps: { src: 'first.wav' } });
  const previous = result.current;

  if (!previous) {
    throw new Error('Initial audio was not registered');
  }

  await previous.play();
  await previous.play();
  rerender({ src: 'replacement.wav' });
  const current = result.current;

  if (!current || current === previous) {
    throw new Error('Replacement audio was not registered');
  }

  act(() => store.dispatch(audioEffectsActions.removeAudioInstance({ id: previous.id, instance: previous })));
  expect(store.getState().audioEffects.audioInstances[current.id]).toBe(current);
  await current.play();
  await act(async () => jest.advanceTimersByTimeAsync(100));
  expect(previous.playing()).toBe(false);
  expect(current.playing()).toBe(true);
  expect(Howl.prototype.play).toHaveBeenCalledTimes(1);
  await current.play();
  unmount();
  await act(async () => jest.advanceTimersByTimeAsync(1000));
  expect(current.playing()).toBe(false);
  expect(Howl.prototype.play).toHaveBeenCalledTimes(1);
  expect(store.getState().audioEffects.audioInstances[current.id]).toBeUndefined();
  expect(jest.getTimerCount()).toBe(0);
});
