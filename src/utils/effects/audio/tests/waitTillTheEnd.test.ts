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

const positionGetter: {
  seek: () => number;
} = Howl.prototype;

beforeEach(() => {
  fixture = installHowlerFixture();
  jest.spyOn(Howl.prototype, 'duration').mockReturnValue(0.2);
  jest.spyOn(rateGetter, 'rate').mockReturnValue(1);
  jest.spyOn(positionGetter, 'seek').mockReturnValue(0);
});

afterEach(() => fixture.restore());

test.each([0.2, 3600])('an explicit request lets a %s second one-shot finish naturally', async (duration) => {
  jest.spyOn(Howl.prototype, 'duration').mockReturnValue(duration);
  const instance = fixture.create();
  await instance.play();
  const unload = unloadAudio(instance, { waitTillTheEnd: true });
  await jest.advanceTimersByTimeAsync(duration * 1000 - 50);
  expect(Howl.prototype.unload).not.toHaveBeenCalled();
  fixture.playing.set(instance.howlInst, false);
  emit(instance.howlInst, 'end');
  await jest.advanceTimersByTimeAsync(20);
  await unload;
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

test.each(['playing flag', 'position'])('missing end is detected by the %s without another fade', async (evidence) => {
  const instance = fixture.create({ fadeOutWhenUnload: true });
  await instance.play();
  const unload = unloadAudio(instance, { waitTillTheEnd: true });
  await jest.advanceTimersByTimeAsync(200);
  expect(instance.playing()).toBe(true);

  if (evidence === 'position') {
    jest.spyOn(positionGetter, 'seek').mockReturnValue(0.2);
  } else {
    fixture.playing.set(instance.howlInst, false);
  }

  await jest.advanceTimersByTimeAsync(200);
  await unload;
  expect(Howl.prototype.fade).not.toHaveBeenCalled();
  expect(instance.state()).toBe('unloaded');
  expect(jest.getTimerCount()).toBe(0);
});

test('explicit unload interrupts graceful waiting and repeated cleanup is safe', async () => {
  const instance = fixture.create();
  await instance.play();
  const first = unloadAudio(instance, { waitTillTheEnd: true });
  const second = unloadAudio(instance, { waitTillTheEnd: true });
  await instance.unload({ immediate: true });
  await jest.advanceTimersByTimeAsync(0);
  await Promise.all([first, second]);
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

test('graceful cleanup waits for the last overlapping voice', async () => {
  const instance = fixture.create();
  await instance.play();
  await instance.play();
  const unload = unloadAudio(instance, { waitTillTheEnd: true });
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

  await unloadAudio(instance, { waitTillTheEnd: true });
  expect(instance.state()).toBe('unloaded');
  await jest.advanceTimersByTimeAsync(1000);
  expect(instance.playing()).toBe(false);
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  expect(listenerCount(instance.howlInst, 'load')).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});

test.each([false, true])('stop with fade %s takes precedence over waiting for a long clip', async (withFade) => {
  jest.spyOn(Howl.prototype, 'duration').mockReturnValue(3600);
  const instance = fixture.create();
  await instance.play();
  const unload = unloadAudio(instance, { waitTillTheEnd: true });
  const stop = instance.stop(withFade);

  if (withFade) {
    await jest.advanceTimersByTimeAsync(999);
    expect(instance.playing()).toBe(true);
    await jest.advanceTimersByTimeAsync(1);
  }

  await Promise.all([stop, unload]);
  expect(instance.state()).toBe('unloaded');
  expect(listenerCount(instance.howlInst, 'end')).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});

test('a finite one-shot at a slower rate keeps enough time to finish', async () => {
  const instance = fixture.create();
  jest.spyOn(rateGetter, 'rate').mockReturnValue(0.5);
  await instance.play();
  const unload = unloadAudio(instance, { waitTillTheEnd: true });
  await jest.advanceTimersByTimeAsync(300);
  expect(Howl.prototype.unload).not.toHaveBeenCalled();
  fixture.playing.set(instance.howlInst, false);
  await jest.advanceTimersByTimeAsync(100);
  await unload;
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

test('stopBy still stops a voice when explicit cleanup would let it play longer', async () => {
  const instance = fixture.create({ stopBy: 100 });
  await instance.play();
  const unload = unloadAudio(instance, { waitTillTheEnd: true });
  await jest.advanceTimersByTimeAsync(100);
  await unload;
  expect(instance.state()).toBe('unloaded');
  expect(jest.getTimerCount()).toBe(0);
});

test('an error releases the explicit playback wait', async () => {
  const instance = fixture.create();
  await instance.play();
  const unload = unloadAudio(instance, { waitTillTheEnd: true });
  emit(instance.howlInst, 'loaderror');
  await jest.advanceTimersByTimeAsync(0);
  await unload;
  expect(instance.state()).toBe('unloaded');
  expect(listenerCount(instance.howlInst, 'loaderror')).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});
