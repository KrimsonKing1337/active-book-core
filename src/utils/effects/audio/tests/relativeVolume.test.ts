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
  NaN,
  Infinity,
  -Infinity,
  -1,
  201,
])('invalid relative volume %s leaves the current voice unchanged', async (percent) => {
  const instance = fixture.create({ relativeVolume: 150 });
  await instance.play();

  expect(() => instance.setRelativeVolume(percent)).toThrow(RangeError);
  expect(() => fixture.create({ relativeVolume: percent })).toThrow(RangeError);
  expect(instance.relativeVolume).toBe(150);
  expect(instance.howlInst.volume(1001)).toBe(1);
  expect(instance.playing()).toBe(true);
  await instance.unload();
});

test.each(['pause', 'stop'] as const)('relative gain preserves a manual %s and its deadline', async (command) => {
  const callback = jest.fn();
  const instance = fixture.create({
    relativeVolume: 200,
    onPause: callback,
    onStop: callback,
  });
  await instance.play();
  const halt = instance[command](true);
  await jest.advanceTimersByTimeAsync(200);
  instance.setRelativeVolume(0);
  await jest.advanceTimersByTimeAsync(300);
  instance.setRelativeVolume(150);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.5, 2);
  expect(instance.playing()).toBe(true);
  expect(instance.isHalting).toBe(true);
  expect(callback).not.toHaveBeenCalled();

  await jest.advanceTimersByTimeAsync(500);
  await halt;
  expect(instance.playing()).toBe(false);
  expect(instance.relativeVolume).toBe(150);
  expect(callback).toHaveBeenCalledTimes(1);
  await instance.unload();
});
