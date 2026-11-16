import type { AudioType } from '@types';

import { store } from '@store';
import { audioEffectsActions } from '@store/effects/audio/audio';

import { installHowlerFixture } from '@utils/effects/audio/tests/howlerFixture';

import { actions, initialState } from '../slice';

import { volumeCases } from './volumeFixture';

const categories: AudioType[] = [
  'sfx',
  'bg',
  'music',
];
const categoryActions = {
  sfx: actions.setSfx,
  bg: actions.setBg,
  music: actions.setMusic,
};
let fixture: ReturnType<typeof installHowlerFixture>;

beforeEach(() => {
  fixture = installHowlerFixture();
  store.dispatch(actions.setAll(initialState));
});

afterEach(() => {
  for (const instance of Object.values(store.getState().audioEffects.audioInstances)) {
    if (instance) {
      store.dispatch(audioEffectsActions.removeAudioInstance({ id: instance.id, instance }));
    }
  }

  fixture.restore();
});

test.each(volumeCases)('audio factors $global/$category/$relative apply once in every update order', (factors) => {
  const {
    global,
    category,
    relative,
  } = factors;
  const expected = global * category * relative / 1_000_000;
  store.dispatch(actions.setAll({
    global,
    sfx: category,
    bg: category,
    music: category,
    videos: 100,
  }));

  for (const type of categories) {
    const instance = fixture.create({
      id: type,
      type,
      relativeVolume: relative,
    });
    // Keep the real Howler volume getter/setter; only decoding and playback are stubbed.
    Reflect.set(instance.howlInst, '_state', 'loaded');
    store.dispatch(audioEffectsActions.setAudioInstance(instance));
    expect(instance.howlInst.volume()).toBeCloseTo(expected, 12);
    store.dispatch(actions.setGlobal(global));
    expect(instance.howlInst.volume()).toBeCloseTo(expected, 12);
    store.dispatch(categoryActions[type](category));
    expect(instance.howlInst.volume()).toBeCloseTo(expected, 12);
    store.dispatch(actions.setGlobal(0));
    expect(instance.howlInst.volume()).toBe(0);
    store.dispatch(categoryActions[type](100));
    expect(instance.howlInst.volume()).toBe(0);
    store.dispatch(actions.setGlobal(global));
    store.dispatch(categoryActions[type](category));
    expect(instance.howlInst.volume()).toBeCloseTo(expected, 12);
    store.dispatch(actions.setGlobal(global));
    expect(instance.howlInst.volume()).toBeCloseTo(expected, 12);
  }
});

test('screamer retains its initial full-volume override and later explicit mixer updates', () => {
  store.dispatch(actions.setGlobal(0));
  store.dispatch(actions.setSfx(50));
  const instance = fixture.create({ screamer: true, relativeVolume: 25 });
  Reflect.set(instance.howlInst, '_state', 'loaded');
  expect(instance.howlInst.volume()).toBe(1);
  store.dispatch(audioEffectsActions.setAudioInstance(instance));
  store.dispatch(actions.setGlobal(50));
  expect(instance.howlInst.volume()).toBeCloseTo(0.0625, 12);
});

test('a stale volume callback cannot enqueue work on a disposed Howl or change its replacement', async () => {
  const previous = fixture.create({ relativeVolume: 50 });
  Reflect.set(previous.howlInst, '_state', 'loaded');
  await previous.unload();
  const current = fixture.create({ relativeVolume: 25 });
  Reflect.set(current.howlInst, '_state', 'loaded');
  setTimeout(() => previous.volume(0.1), 100);
  await jest.advanceTimersByTimeAsync(100);
  expect(current.howlInst.volume()).toBe(0.25);
  expect(previous.state()).toBe('unloaded');
  expect(Reflect.get(previous.howlInst, '_queue')).toEqual([]);
  expect(jest.getTimerCount()).toBe(0);
});

test('unchanged non-quarter settings preserve exactly the initial value without conversion drift', () => {
  store.dispatch(actions.setGlobal(37));
  store.dispatch(actions.setSfx(29));
  const instance = fixture.create({ relativeVolume: 43 });
  Reflect.set(instance.howlInst, '_state', 'loaded');
  store.dispatch(audioEffectsActions.setAudioInstance(instance));
  const initialVolume = instance.howlInst.volume();
  expect(initialVolume).toBeCloseTo(0.046139, 12);
  store.dispatch(actions.setGlobal(37));
  expect(instance.howlInst.volume()).toBe(initialVolume);
  store.dispatch(actions.setSfx(29));
  expect(instance.howlInst.volume()).toBe(initialVolume);
});

test.each([undefined, 0])('relative volume %s distinguishes the default from explicit silence', (relativeVolume) => {
  store.dispatch(actions.setGlobal(25));
  store.dispatch(actions.setSfx(50));
  const instance = fixture.create({ relativeVolume });
  let expected = 0.125;

  if (relativeVolume === 0) {
    expected = 0;
  }

  expect(instance.howlInst.volume()).toBe(expected);
});
