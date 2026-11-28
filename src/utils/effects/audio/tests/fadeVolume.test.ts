import { store } from '@store';
import { volumeActions } from '@store/volume';
import { initialState } from '@store/volume/slice';

import { installFadeFixture } from './fadeFixture';

let fixture: ReturnType<typeof installFadeFixture>;

beforeEach(() => {
  fixture = installFadeFixture();
  store.dispatch(volumeActions.setAll(initialState));
});

afterEach(() => fixture.restore());

test.each([
  {
    global: 0,
    category: 50,
    relative: 50,
  },
  {
    global: 50,
    category: 0,
    relative: 50,
  },
  {
    global: 50,
    category: 50,
    relative: 0,
  },
  {
    global: 50,
    category: 25,
    relative: 50,
  },
])('mixer factors $global/$category/$relative preserve the fade-in progress and deadline', async (factors) => {
  const instance = fixture.create();
  const play = instance.play(true);
  await jest.advanceTimersByTimeAsync(200);
  store.dispatch(volumeActions.setGlobal(factors.global));
  store.dispatch(volumeActions.setSfx(factors.category));
  instance.setRelativeVolume(factors.relative);
  instance.volume(instance.getVolumeByType() / 100);
  await jest.advanceTimersByTimeAsync(300);
  const volume = factors.global * factors.category * factors.relative / 1_000_000;
  expect(instance.howlInst.volume(1001)).toBeCloseTo(volume / 2, 2);
  expect(instance.isFading).toBe(true);
  await jest.advanceTimersByTimeAsync(500);
  await play;
  expect(instance.playing()).toBe(true);
  expect(instance.howlInst.volume(1001)).toBe(volume);
  expect(instance.isFading).toBe(false);
  await instance.unload();
  expect(jest.getTimerCount()).toBe(0);
});

test('independent wrappers keep their own fade progress and cancellation', async () => {
  const first = fixture.create({ id: 'first', relativeVolume: 50 });
  const second = fixture.create({ id: 'second', relativeVolume: 25 });
  const firstPlay = first.play(true);
  const secondPlay = second.play(true);
  await jest.advanceTimersByTimeAsync(500);
  expect(first.howlInst.volume(1001)).toBeCloseTo(0.25, 2);
  expect(second.howlInst.volume(1002)).toBeCloseTo(0.125, 2);
  await first.stop();
  await jest.advanceTimersByTimeAsync(500);
  await Promise.all([firstPlay, secondPlay]);
  expect(first.playing()).toBe(false);
  expect(second.playing()).toBe(true);
  expect(second.howlInst.volume(1002)).toBe(0.25);
  await Promise.all([first.unload(), second.unload()]);
  expect(jest.getTimerCount()).toBe(0);
});

test('amplification respects the user mute throughout fades and repeated playback', async () => {
  store.dispatch(volumeActions.setGlobal(0));
  const instance = fixture.create({ relativeVolume: 200 });
  const first = instance.play(true);
  await jest.advanceTimersByTimeAsync(500);
  expect(instance.howlInst.volume(1001)).toBe(0);
  instance.volume(instance.getVolumeByType() / 100);
  expect(instance.isFading).toBe(true);
  await jest.advanceTimersByTimeAsync(500);
  await first;
  const second = instance.play(true);
  await jest.advanceTimersByTimeAsync(1001);
  await second;
  expect(instance.howlInst.volume(1001)).toBe(0);
  expect(instance.howlInst.volume(1002)).toBe(0);
  expect(instance.isFading).toBe(false);
  await instance.unload();
  expect(jest.getTimerCount()).toBe(0);
});

test('sound gains keep advancing independently while the base volume is zero', async () => {
  const instance = fixture.create();
  const first = instance.play(true);
  await jest.advanceTimersByTimeAsync(200);
  instance.volume(0);
  const second = instance.play(true);
  await jest.advanceTimersByTimeAsync(300);
  expect(instance.howlInst.volume(1001)).toBe(0);
  expect(instance.howlInst.volume(1002)).toBe(0);

  instance.volume(0.5);
  expect(instance.howlInst.volume()).toBe(0.5);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.25, 2);
  expect(instance.howlInst.volume(1002)).toBeCloseTo(0.15, 2);
  await jest.advanceTimersByTimeAsync(500);
  await first;
  expect(instance.howlInst.volume(1001)).toBe(0.5);
  expect(instance.howlInst.volume(1002)).toBeCloseTo(0.4, 2);
  await jest.advanceTimersByTimeAsync(210);
  await second;
  expect(instance.howlInst.volume(1002)).toBe(0.5);
});

test('a scoped fade multiplies its levels by the base volume', async () => {
  const instance = fixture.create({ relativeVolume: 50 });
  await instance.play();
  const fade = instance.fade({
    from: 0.8,
    to: 0.2,
    duration: 1000,
    soundId: 1001,
  });
  expect(instance.howlInst.volume(1001)).toBe(0.4);
  await jest.advanceTimersByTimeAsync(500);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.25, 4);
  instance.volume(0.5);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.125, 4);
  await jest.advanceTimersByTimeAsync(250);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.0875, 4);
  instance.volume(1);
  await jest.advanceTimersByTimeAsync(250);
  expect(await fade).toBe(true);
  expect(instance.howlInst.volume(1001)).toBe(0.1);
  expect(instance.howlInst.volume()).toBe(0.5);
  instance.volume(0.8);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.08, 4);
});
