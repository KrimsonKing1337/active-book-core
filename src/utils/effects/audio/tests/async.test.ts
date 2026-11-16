import { Howl } from 'howler';

import {
  emit,
  installHowlerFixture,
  listenerCount,
} from './howlerFixture';

let fixture: ReturnType<typeof installHowlerFixture>;

beforeEach(() => {
  fixture = installHowlerFixture();
});

afterEach(() => fixture.restore());

const controls: Array<'stop' | 'pause' | 'unload'> = [
  'stop',
  'pause',
  'unload',
];

test.each(controls)('%s cancels a start waiting for load', async (method) => {
  const instance = fixture.create();
  fixture.states.set(instance.howlInst, 'loading');
  await instance.play();
  await instance[method]();
  fixture.states.set(instance.howlInst, 'loaded');
  emit(instance.howlInst, 'load');
  await jest.advanceTimersByTimeAsync(0);
  expect(Howl.prototype.play).not.toHaveBeenCalled();
  expect(listenerCount(instance.howlInst, 'load')).toBe(0);
  expect(listenerCount(instance.howlInst, 'loaderror')).toBe(0);
});

test.each(controls)('%s invalidates the continuation after fadeIn', async (method) => {
  const instance = fixture.create();
  const play = instance.play(true);
  await instance[method]();
  await jest.advanceTimersByTimeAsync(1000);
  await play;
  expect(Howl.prototype.play).not.toHaveBeenCalled();
  expect(instance.isFading).toBe(false);
  expect(jest.getTimerCount()).toBe(0);
});

test('a new play interrupts a fade without letting its old continuation start another voice', async () => {
  const instance = fixture.create();
  const previous = instance.play(true);
  await instance.play();
  await jest.advanceTimersByTimeAsync(1000);
  await previous;
  expect(Howl.prototype.play).toHaveBeenCalledTimes(1);
});

test('load failure clears the request deadline and allows a subsequent loaded request', async () => {
  const instance = fixture.create({ stopBy: 100 });
  fixture.states.set(instance.howlInst, 'loading');
  await instance.play();
  emit(instance.howlInst, 'loaderror');
  await jest.advanceTimersByTimeAsync(0);
  expect(jest.getTimerCount()).toBe(0);
  expect(listenerCount(instance.howlInst, 'load')).toBe(0);
  fixture.states.set(instance.howlInst, 'loaded');
  instance.stopBy = 0;
  await instance.play();
  await jest.advanceTimersByTimeAsync(100);
  expect(instance.playing()).toBe(true);
});

test('callbacks already queued by Howler cannot fire after cancellation', async () => {
  const onPlay = jest.fn();
  const instance = fixture.create({ onPlay });
  await instance.play();
  emit(instance.howlInst, 'play');
  await instance.stop();
  await jest.advanceTimersByTimeAsync(0);
  expect(onPlay).not.toHaveBeenCalled();
  expect(listenerCount(instance.howlInst, 'play')).toBe(0);
});

test('repeated pause and stop without native events do not accumulate listeners', async () => {
  const instance = fixture.create();

  for (let index = 0; index < 5; index += 1) {
    await instance.pause();
    await instance.stop();
  }

  expect(listenerCount(instance.howlInst, 'pause')).toBe(0);
  expect(listenerCount(instance.howlInst, 'stop')).toBeLessThanOrEqual(1);
  await instance.unload();
  expect(listenerCount(instance.howlInst, 'stop')).toBe(0);
});

test('loading retains multiple play requests and clears both load subscriptions on success', async () => {
  const instance = fixture.create();
  fixture.states.set(instance.howlInst, 'loading');
  await instance.play();
  await instance.play();
  expect(Howl.prototype.play).not.toHaveBeenCalled();
  fixture.states.set(instance.howlInst, 'loaded');
  emit(instance.howlInst, 'load');
  await jest.advanceTimersByTimeAsync(0);
  expect(Howl.prototype.play).toHaveBeenCalledTimes(2);
  expect(listenerCount(instance.howlInst, 'load')).toBe(0);
  expect(listenerCount(instance.howlInst, 'loaderror')).toBe(0);
});

test('an obsolete faded stop cannot stop a newer play', async () => {
  const instance = fixture.create();
  await instance.play();
  const stop = instance.stop(true);
  await instance.play();
  await jest.advanceTimersByTimeAsync(1000);
  await stop;
  expect(instance.playing()).toBe(true);
  expect(Howl.prototype.play).toHaveBeenCalledTimes(2);
});

test('unload settles a fade waiting for load and removes its subscriptions', async () => {
  const instance = fixture.create();
  fixture.states.set(instance.howlInst, 'loading');
  const play = instance.play(true);
  await instance.unload();
  await play;
  expect(Howl.prototype.fade).not.toHaveBeenCalled();
  expect(Howl.prototype.play).not.toHaveBeenCalled();
  expect(listenerCount(instance.howlInst, 'load')).toBe(0);
  expect(listenerCount(instance.howlInst, 'loaderror')).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});

test('a queued loaderror from an old request cannot cancel its replacement', async () => {
  const instance = fixture.create();
  fixture.states.set(instance.howlInst, 'loading');
  await instance.play();
  emit(instance.howlInst, 'loaderror');
  await instance.stop();
  fixture.states.set(instance.howlInst, 'loaded');
  instance.delay = 100;
  await instance.play();
  await jest.advanceTimersByTimeAsync(100);
  expect(instance.playing()).toBe(true);
});
