import type { PropsWithChildren } from 'react';

import { StrictMode } from 'react';

import {
  act,
  cleanup,
  renderHook,
} from '@testing-library/react';
import { Howl } from 'howler';

import type { AudioType } from '@types';

import { StoreProvider, store } from '@store';
import { mainActions } from '@store/main';
import { audioEffectsActions } from '@store/effects/audio/audio';
import { volumeActions } from '@store/volume';

import { HowlWrapper } from '@utils/effects/audio/HowlWrapper';

import { useAudio } from './useAudio';
import { useAudioController } from './useAudioController';

const wrapper = ({ children }: PropsWithChildren) => (
  <StrictMode>
    <StoreProvider>
      {children}
    </StoreProvider>
  </StrictMode>
);

beforeEach(() => {
  jest.spyOn(Howl.prototype, 'load').mockReturnThis();
  jest.spyOn(Howl.prototype, 'state').mockReturnValue('loaded');
  jest.spyOn(Howl.prototype, 'duration').mockReturnValue(2);
  jest.spyOn(Howl.prototype, 'play').mockReturnValue(1);
  store.dispatch(mainActions.setStoryPages(['first', 'second']));
  store.dispatch(mainActions.setPage(1));
  store.dispatch(mainActions.setIsAudioUnlocked(true));
  store.dispatch(volumeActions.setGlobal(100));
});

afterEach(async () => {
  await act(async () => cleanup());

  for (const instance of Object.values(store.getState().audioEffects.audioInstances)) {
    if (instance) {
      store.dispatch(audioEffectsActions.removeAudioInstance({ id: instance.id, instance }));
    }
  }

  jest.restoreAllMocks();
});

test.each<AudioType>([
  'bg',
  'music',
  'sfx',
])('%s keeps page ownership and ignores stale cleanup in StrictMode', (type) => {
  const { result, rerender } = renderHook(({ src }) => useAudio({
    id: 'page-audio',
    page: 1,
    src,
    type,
    fadeOutWhenUnload: false,
  }), { initialProps: { src: 'first.wav' }, wrapper });
  const previous = result.current;
  expect(previous).toBeInstanceOf(HowlWrapper);
  rerender({ src: 'replacement.wav' });
  const current = result.current;
  expect(current).not.toBe(previous);

  if (!previous || !current) {
    throw new Error('Audio instances were not registered');
  }

  act(() => store.dispatch(audioEffectsActions.removeAudioInstance({ id: previous.id, instance: previous })));
  expect(store.getState().audioEffects.audioInstances[current.id]).toBe(current);
  expect(current.isUnloading).toBe(false);
  act(() => store.dispatch(mainActions.setPage(2)));
  expect(store.getState().audioEffects.audioInstances[current.id]).toBeUndefined();
  expect(current.isUnloading).toBe(true);
});

test('BookRuntime controller keeps manual ownership and controls the current instance after unmount', () => {
  const { result, unmount } = renderHook(() => {
    const audio = useAudio({
      id: 'manual',
      page: 1,
      src: 'manual.wav',
      lifecycle: 'manual',
      fadeOutWhenUnload: false,
    });
    const controller = useAudioController('manual');

    return { audio, controller };
  }, { wrapper });
  const { audio, controller } = result.current;

  if (!audio) {
    throw new Error('Manual audio was not registered');
  }

  const play = jest.spyOn(audio, 'play').mockResolvedValue();
  const pause = jest.spyOn(audio, 'pause').mockResolvedValue();
  const stop = jest.spyOn(audio, 'stop').mockResolvedValue();
  unmount();
  expect(store.getState().audioEffects.audioInstances.manual).toBe(audio);
  controller.play();
  controller.pause();
  controller.stop();
  expect(play).toHaveBeenCalledTimes(1);
  expect(pause).toHaveBeenCalledTimes(1);
  expect(stop).toHaveBeenCalledTimes(1);
  controller.remove();
  expect(store.getState().audioEffects.audioInstances.manual).toBeUndefined();
  expect(audio.isUnloading).toBe(true);
});
