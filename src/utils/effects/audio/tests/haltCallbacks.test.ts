import { Howler } from 'howler';

import { installFadeFixture } from './fadeFixture';
import { emit } from './howlerFixture';

let fixture: ReturnType<typeof installFadeFixture>;

beforeEach(() => {
  fixture = installFadeFixture();
});

afterEach(() => fixture.restore());

test('leaves WebKit’s initial interrupted state to the normal Howler resume path', async () => {
  const instance = fixture.create();
  const state: unknown = Reflect.get(Howler, 'state');

  try {
    Reflect.set(Howler, 'state', 'interrupted');
    await instance.play();
    expect(Reflect.get(Howler, 'state')).toBe('suspended');
  } finally {
    Reflect.set(Howler, 'state', state);
  }
});

test.each([
  { command: 'pause', withFade: false },
  { command: 'stop', withFade: false },
  { command: 'pause', withFade: true },
  { command: 'stop', withFade: true },
] as const)('$command withFade=$withFade reports one completed command for multiple voices', async ({
  command,
  withFade,
}) => {
  const events: string[] = [];
  const instance = fixture.create({
    onPause: () => events.push('pause'),
    onStop: () => events.push('stop'),
    onUnload: () => events.push('unload'),
  });

  await instance.play();
  await instance.play();
  const halted = instance[command](withFade);
  const completed = halted.then(() => events.push('resolved'));

  if (withFade) {
    await jest.advanceTimersByTimeAsync(999);
    expect(events).toEqual([]);
    expect(instance.playing()).toBe(true);
    await jest.advanceTimersByTimeAsync(1);
  }

  await completed;
  await instance.unload({ immediate: true });
  await jest.advanceTimersByTimeAsync(0);
  expect(events).toEqual([
    command,
    'resolved',
    'unload',
  ]);
});

test('new play cancels a faded pause and immediate unload cancels a faded stop', async () => {
  const onPause = jest.fn();
  const onStop = jest.fn();
  const onUnload = jest.fn();
  const instance = fixture.create({
    onPause,
    onStop,
    onUnload,
  });
  await instance.play();
  const paused = instance.pause(true);
  await jest.advanceTimersByTimeAsync(100);
  await instance.play();
  await paused;
  const stopped = instance.stop(true);
  await instance.unload({ immediate: true });
  await stopped;
  await jest.advanceTimersByTimeAsync(1500);
  expect(onPause).not.toHaveBeenCalled();
  expect(onStop).not.toHaveBeenCalled();
  expect(onUnload).toHaveBeenCalledTimes(1);
});

test('a halt waits for a locked native start and gives no notification if replaced', async () => {
  const onPause = jest.fn();
  const onStop = jest.fn();
  const instance = fixture.create({ onPause, onStop });
  await instance.play();
  await jest.advanceTimersByTimeAsync(1);
  const howl = instance.howlInst;
  const nativePause = jest.spyOn(howl, 'pause');
  const nativeStop = jest.spyOn(howl, 'stop');
  Reflect.set(howl, '_playLock', true);
  const stopped = instance.stop();
  expect(nativeStop).not.toHaveBeenCalled();

  await instance.play();
  await stopped;
  expect(onStop).not.toHaveBeenCalled();
  const paused = instance.pause();
  expect(nativePause).not.toHaveBeenCalled();
  Reflect.set(howl, '_playLock', false);
  emit(howl, 'play');
  await jest.advanceTimersByTimeAsync(1);
  await paused;
  expect(nativePause).toHaveBeenCalledTimes(1);
  expect(onPause).toHaveBeenCalledTimes(1);
});

test('automatic stopBy commits one stop callback before a reentrant unload', async () => {
  const events: string[] = [];
  const instance = fixture.create({ stopBy: 100 });
  instance.onStop = () => {
    expect(instance.playing()).toBe(false);
    events.push('stop');
    void instance.unload();
  };
  instance.onUnload = () => {
    events.push('unload');
  };
  await instance.play();
  await instance.play();
  await jest.advanceTimersByTimeAsync(99);
  expect(events).toEqual([]);
  await jest.advanceTimersByTimeAsync(1);
  expect(events).toEqual(['stop', 'unload']);
});

test('reentrant unload shares its original promise and does not generate a stop notification', async () => {
  const onStop = jest.fn();
  const instance = fixture.create({ onStop });
  let repeated: Promise<void> | undefined;
  const onUnload = jest.fn(() => {
    repeated = instance.unload({ immediate: true });
  });
  instance.onUnload = onUnload;
  await instance.play();
  const unloaded = instance.unload({ immediate: true });
  expect(repeated).toBe(unloaded);
  await unloaded;
  await jest.advanceTimersByTimeAsync(0);
  expect(onUnload).toHaveBeenCalledTimes(1);
  expect(onStop).not.toHaveBeenCalled();
});
