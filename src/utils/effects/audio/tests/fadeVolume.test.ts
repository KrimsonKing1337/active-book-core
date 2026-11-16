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
])('mixer factors $global/$category/$relative cancel fade-in and preserve the new target', async (factors) => {
  const instance = fixture.create();
  const play = instance.play(true);
  await jest.advanceTimersByTimeAsync(200);
  store.dispatch(volumeActions.setGlobal(factors.global));
  store.dispatch(volumeActions.setSfx(factors.category));
  instance.relativeVolume = factors.relative;
  instance.volume(instance.getVolumeByType() / 100);
  await play;
  await jest.advanceTimersByTimeAsync(1500);
  expect(instance.playing()).toBe(true);
  expect(instance.howlInst.volume(1001)).toBe(factors.global * factors.category * factors.relative / 1_000_000);
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

test('screamer fades to its initial override until an explicit mixer update replaces it', async () => {
  store.dispatch(volumeActions.setGlobal(0));
  const instance = fixture.create({ screamer: true, relativeVolume: 0 });
  const first = instance.play(true);
  await jest.advanceTimersByTimeAsync(500);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.5, 2);
  instance.volume(instance.getVolumeByType() / 100);
  await first;
  const second = instance.play(true);
  await jest.advanceTimersByTimeAsync(0);
  await second;
  expect(instance.howlInst.volume(1001)).toBe(0);
  expect(instance.howlInst.volume(1002)).toBe(0);
  expect(instance.isFading).toBe(false);
  await instance.unload();
  expect(jest.getTimerCount()).toBe(0);
});
