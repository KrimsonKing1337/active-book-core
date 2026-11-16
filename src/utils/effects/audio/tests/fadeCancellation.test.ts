import { installFadeFixture } from './fadeFixture';

let fixture: ReturnType<typeof installFadeFixture>;

beforeEach(() => {
  fixture = installFadeFixture();
});

afterEach(() => fixture.restore());

test.each<'pause' | 'stop' | 'unload'>([
  'pause',
  'stop',
  'unload',
])('%s cancels a running fade without a late restart or callback', async (method) => {
  const onPlay = jest.fn();
  const instance = fixture.create({ onPlay });
  const play = instance.play(true);
  await jest.advanceTimersByTimeAsync(250);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.25, 2);
  await instance[method]();
  await play;
  await jest.advanceTimersByTimeAsync(1500);
  expect(instance.playing()).toBe(false);
  expect(onPlay).toHaveBeenCalledTimes(1);
  expect(instance.isFading).toBe(false);
  await instance.unload();
  expect(jest.getTimerCount()).toBe(0);
});

test('new scoped fade cancels only the replaced animation and its endpoint cannot return later', async () => {
  const instance = fixture.create();
  await instance.play();
  await instance.play();
  const first = instance.fade({
    from: 0,
    to: 1,
    duration: 1000,
    soundId: 1001,
  });
  const second = instance.fade({
    from: 0,
    to: 1,
    duration: 1000,
    soundId: 1002,
  });
  await jest.advanceTimersByTimeAsync(300);
  const replacement = instance.fade({
    from: 0.3,
    to: 0.1,
    duration: 200,
    soundId: 1001,
  });
  expect(await first).toBe(false);
  await jest.advanceTimersByTimeAsync(710);
  expect(await replacement).toBe(true);
  expect(await second).toBe(true);
  expect(instance.howlInst.volume(1001)).toBe(0.1);
  expect(instance.howlInst.volume(1002)).toBe(1);
  await instance.unload();
  expect(jest.getTimerCount()).toBe(0);
});

test('repeated faded stop replaces the earlier command, and immediate stop interrupts it', async () => {
  const onStop = jest.fn();
  const instance = fixture.create({ onStop });
  await instance.play();
  const first = instance.stop(true);
  await jest.advanceTimersByTimeAsync(250);
  const second = instance.stop(true);
  await first;
  await jest.advanceTimersByTimeAsync(750);
  expect(instance.playing()).toBe(true);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.1875, 3);
  await instance.stop();
  await second;
  await jest.advanceTimersByTimeAsync(1000);
  expect(instance.playing()).toBe(false);
  expect(onStop).toHaveBeenCalledTimes(1);
  await instance.unload();
  expect(jest.getTimerCount()).toBe(0);
});

test('a new play cancels faded stop at its completion boundary', async () => {
  const instance = fixture.create();
  await instance.play();
  const stop = instance.stop(true);
  setTimeout(() => void instance.play(), 1000);
  await jest.advanceTimersByTimeAsync(1010);
  await stop;
  expect(instance.howlInst.playing(1002)).toBe(true);
  await instance.unload();
  expect(jest.getTimerCount()).toBe(0);
});

test('unload finishes once even when its own fade is interrupted by pause', async () => {
  const onUnload = jest.fn();
  const instance = fixture.create({ fadeOutWhenUnload: true, onUnload });
  await instance.play();
  const unload = instance.unload();
  await jest.advanceTimersByTimeAsync(250);
  const sameUnload = instance.unload();
  await instance.pause();
  await Promise.all([unload, sameUnload]);
  await jest.advanceTimersByTimeAsync(1500);
  expect(instance.state()).toBe('unloaded');
  expect(instance.isFading).toBe(false);
  expect(onUnload).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});
