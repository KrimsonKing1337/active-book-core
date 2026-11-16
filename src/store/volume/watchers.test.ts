import { Howl } from 'howler';

import type { AudioType } from '@types';

import { store } from '@store';
import { audioEffectsActions } from '@store/effects/audio/audio';

import { HowlWrapper } from '@utils/effects/audio/HowlWrapper';

import { actions } from './slice';

const categories: AudioType[] = [
  'bg',
  'music',
  'sfx',
];

beforeEach(() => {
  jest.spyOn(Howl.prototype, 'load').mockReturnThis();
  jest.spyOn(Howl.prototype, 'duration').mockReturnValue(2);
  store.dispatch(actions.setGlobal(100));
});

afterEach(() => {
  for (const instance of Object.values(store.getState().audioEffects.audioInstances)) {
    if (instance) {
      store.dispatch(audioEffectsActions.removeAudioInstance({ id: instance.id, instance }));
    }
  }

  jest.restoreAllMocks();
});

test('category volume changes target only matching instances in the shared audio slice', () => {
  const volume = categories.map((type) => {
    const instance = new HowlWrapper({
      id: type,
      page: 1,
      src: `${type}.wav`,
      type,
      fadeOutWhenUnload: false,
    });
    store.dispatch(audioEffectsActions.setAudioInstance(instance));

    return jest.spyOn(instance, 'volume').mockImplementation();
  });

  store.dispatch(actions.setBg(30));
  expect(volume[0]).toHaveBeenLastCalledWith(0.3);
  expect(volume[1]).not.toHaveBeenCalled();
  expect(volume[2]).not.toHaveBeenCalled();
  store.dispatch(actions.setMusic(40));
  expect(volume[1]).toHaveBeenLastCalledWith(0.4);
  expect(volume[0]).toHaveBeenCalledTimes(1);
  expect(volume[2]).not.toHaveBeenCalled();
  store.dispatch(actions.setSfx(50));
  expect(volume[2]).toHaveBeenLastCalledWith(0.5);
  expect(volume[0]).toHaveBeenCalledTimes(1);
  expect(volume[1]).toHaveBeenCalledTimes(1);
  expect(Object.keys(store.getState().audioEffects.audioInstances)).toEqual(categories);
});
