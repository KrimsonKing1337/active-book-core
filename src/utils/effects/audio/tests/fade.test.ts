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

test('fade-in starts a playing voice at zero and has an audible midpoint', async () => {
  const instance = fixture.create();
  const play = instance.play(true);
  await jest.advanceTimersByTimeAsync(500);
  expect(instance.playing()).toBe(true);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.5, 2);
  expect(fixture.events[0].event).toBe('play');
  await jest.advanceTimersByTimeAsync(500);
  await play;
  expect(instance.howlInst.volume(1001)).toBe(1);
});

test('a second play during fade-in preserves both voices and their independent gains', async () => {
  const instance = fixture.create();
  const first = instance.play(true);
  await jest.advanceTimersByTimeAsync(250);
  await instance.play();
  expect(instance.howlInst.playing(1001)).toBe(true);
  expect(instance.howlInst.playing(1002)).toBe(true);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.25, 2);
  expect(instance.howlInst.volume(1002)).toBe(1);
  await jest.advanceTimersByTimeAsync(750);
  await first;
  expect(instance.howlInst.playing(1001)).toBe(true);
});

test.each([0, 200])('fade duration %s reaches its target and settles', async (duration) => {
  const instance = fixture.create();
  await instance.play();
  const fade = instance.fade({
    from: 0,
    to: 0.5,
    duration,
  });
  await jest.advanceTimersByTimeAsync(duration);
  await fade;
  expect(instance.howlInst.volume(1001)).toBe(0.5);

  if (duration > 0) {
    expect(fixture.events.find((event) => event.event === 'fade')?.duration).toBe(duration);
  }

  await instance.unload();
  expect(jest.getTimerCount()).toBe(0);
});

test('delay defers both the voice and its fade-in', async () => {
  const instance = fixture.create({ delay: 200 });
  const play = instance.play(true);
  await jest.advanceTimersByTimeAsync(199);
  expect(fixture.events).toEqual([]);
  await jest.advanceTimersByTimeAsync(501);
  expect(instance.playing()).toBe(true);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.5, 2);
  await jest.advanceTimersByTimeAsync(510);
  await play;
});

test('stopBy retains its command deadline while a voice is fading in', async () => {
  const instance = fixture.create({ stopBy: 200 });
  const play = instance.play(true);
  await jest.advanceTimersByTimeAsync(100);
  expect(instance.playing()).toBe(true);
  await jest.advanceTimersByTimeAsync(1500);
  await play;
  expect(instance.playing()).toBe(false);
  expect(fixture.events.filter((event) => event.event === 'play')).toHaveLength(1);
  expect(jest.getTimerCount()).toBe(0);
});

test('fade-out decreases from the actual partial gain before stop and restores its target afterwards', async () => {
  const instance = fixture.create();
  const play = instance.play(true);
  await jest.advanceTimersByTimeAsync(400);
  const stop = instance.stop(true);
  await jest.advanceTimersByTimeAsync(500);
  expect(instance.playing()).toBe(true);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.2, 2);
  await jest.advanceTimersByTimeAsync(500);
  await Promise.all([play, stop]);
  expect(instance.playing()).toBe(false);
  expect(instance.howlInst.volume()).toBe(1);
});

test.each(['stop', 'pause'] as const)('mixer edits preserve a faded %s and its deadline', async (command) => {
  const instance = fixture.create();
  await instance.play();
  const halt = instance[command](true);
  await jest.advanceTimersByTimeAsync(200);
  store.dispatch(volumeActions.setGlobal(50));
  instance.volume(1);
  await jest.advanceTimersByTimeAsync(300);
  expect(instance.playing()).toBe(true);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.25, 4);
  await jest.advanceTimersByTimeAsync(500);
  await halt;
  expect(instance.playing()).toBe(false);
  expect(instance.howlInst.volume()).toBe(0.5);
});

test('a volume edit applies to a delayed play without cancelling it', async () => {
  const instance = fixture.create();
  instance.delay = 200;
  const play = instance.play(true);
  instance.volume(0.5);
  await jest.advanceTimersByTimeAsync(1210);
  await play;
  expect(instance.howlInst.playing(1001)).toBe(true);
  expect(instance.howlInst.volume(1001)).toBe(0.5);
});
