import { Howl } from 'howler';

import { unloadAudio } from '../unloadAudio';

import {
  emit,
  installHowlerFixture,
  listenerCount,
} from './howlerFixture';

let fixture: ReturnType<typeof installHowlerFixture>;

// Cleanup reads rate(); the setter overload is not part of this fixture.
const rateGetter: {
  rate: () => number;
} = Howl.prototype;

beforeEach(() => {
  fixture = installHowlerFixture();
  jest.spyOn(Howl.prototype, 'duration').mockReturnValue(0.2);
  jest.spyOn(rateGetter, 'rate').mockReturnValue(1);
});

afterEach(() => fixture.restore());

test('short loop unloads without waiting for a natural end', async () => {
  const instance = fixture.create({ loop: true });
  await instance.play();
  const unload = unloadAudio(instance);
  await jest.advanceTimersByTimeAsync(1500);
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  await unload;
  expect(jest.getTimerCount()).toBe(0);
});

test('finite short one-shot may finish naturally before unloading', async () => {
  const instance = fixture.create();
  await instance.play();
  const unload = unloadAudio(instance);
  await jest.advanceTimersByTimeAsync(50);
  expect(Howl.prototype.unload).not.toHaveBeenCalled();
  fixture.playing.set(instance.howlInst, false);
  emit(instance.howlInst, 'end');
  await jest.advanceTimersByTimeAsync(20);
  await unload;
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

test('missing native end cannot retain a finite sound indefinitely', async () => {
  const instance = fixture.create();
  await instance.play();
  const unload = unloadAudio(instance);
  await jest.advanceTimersByTimeAsync(1500);
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  await unload;
  expect(jest.getTimerCount()).toBe(0);
});

test('explicit unload interrupts graceful waiting and repeated cleanup is safe', async () => {
  const instance = fixture.create();
  await instance.play();
  const first = unloadAudio(instance);
  const second = unloadAudio(instance);
  await instance.unload();
  await jest.advanceTimersByTimeAsync(0);
  await Promise.all([first, second]);
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

test('graceful cleanup waits for the last overlapping voice', async () => {
  const instance = fixture.create();
  await instance.play();
  await instance.play();
  const unload = unloadAudio(instance);
  emit(instance.howlInst, 'end');
  await jest.advanceTimersByTimeAsync(50);
  expect(Howl.prototype.unload).not.toHaveBeenCalled();
  fixture.playing.set(instance.howlInst, false);
  emit(instance.howlInst, 'end');
  await jest.advanceTimersByTimeAsync(0);
  await unload;
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);

  const completionEvents = [
    'end',
    'pause',
    'stop',
  ];

  for (const event of completionEvents) {
    expect(listenerCount(instance.howlInst, event)).toBe(0);
  }

  expect(jest.getTimerCount()).toBe(0);
});

test.each([
  'delayed',
  'loading',
  'paused',
])('%s sound has no grace period or late restart', async (state) => {
  const instance = fixture.create({ delay: 100 });

  if (state === 'loading') {
    instance.delay = 0;
    fixture.states.set(instance.howlInst, 'loading');
  }

  if (state === 'paused') {
    instance.delay = 0;
  }

  await instance.play();

  if (state === 'paused') {
    await instance.pause();
  }

  await unloadAudio(instance);
  expect(instance.state()).toBe('unloaded');
  await jest.advanceTimersByTimeAsync(1000);
  expect(instance.playing()).toBe(false);
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  expect(listenerCount(instance.howlInst, 'load')).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});

test('repeated lifetime cleanup does not interrupt or restart the existing unload fade', async () => {
  const instance = fixture.create({ loop: true, fadeOutWhenUnload: true });
  await instance.play();
  const first = unloadAudio(instance);
  await jest.advanceTimersByTimeAsync(500);
  const second = unloadAudio(instance);
  await jest.advanceTimersByTimeAsync(100);
  expect(Howl.prototype.unload).not.toHaveBeenCalled();
  expect(Howl.prototype.fade).toHaveBeenCalledTimes(1);
  await jest.advanceTimersByTimeAsync(400);
  await Promise.all([first, second]);
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

test('stop interrupts the one-shot grace period without leaving its deadline or listeners', async () => {
  const instance = fixture.create();
  await instance.play();
  const unload = unloadAudio(instance);
  await instance.stop();
  await unload;
  expect(instance.state()).toBe('unloaded');
  expect(listenerCount(instance.howlInst, 'end')).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});

test('a finite one-shot at a slower rate keeps enough time to finish', async () => {
  const instance = fixture.create();
  jest.spyOn(rateGetter, 'rate').mockReturnValue(0.5);
  await instance.play();
  const unload = unloadAudio(instance);
  await jest.advanceTimersByTimeAsync(300);
  expect(Howl.prototype.unload).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(100);
  await unload;
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});
