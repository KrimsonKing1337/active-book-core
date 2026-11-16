import { Howl } from 'howler';

import { installHowlerFixture, listenerCount } from './howlerFixture';

let fixture: ReturnType<typeof installHowlerFixture>;

beforeEach(() => {
  fixture = installHowlerFixture();
});

afterEach(() => fixture.restore());

test.each<'stop' | 'pause'>(['stop', 'pause'])('%s cancels every delayed start and its deadline', async (method) => {
  const instance = fixture.create({ delay: 100, stopBy: 500 });
  await instance.play();
  await instance.play();
  await instance.play();
  await instance[method]();
  jest.advanceTimersByTime(1000);
  expect(Howl.prototype.play).not.toHaveBeenCalled();
  expect(listenerCount(instance.howlInst, 'play')).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});

test('repeated delayed play retains polyphony until explicitly cancelled', async () => {
  const instance = fixture.create({ delay: 100 });
  await instance.play();
  await instance.play();
  jest.advanceTimersByTime(100);
  expect(Howl.prototype.play).toHaveBeenCalledTimes(2);
});

test('stop permits a new request and does not cancel a different effect', async () => {
  const first = fixture.create({ id: 'first', delay: 100 });
  const second = fixture.create({ id: 'second', delay: 100 });
  await first.play();
  await second.play();
  await first.stop();
  jest.advanceTimersByTime(100);
  expect(first.playing()).toBe(false);
  expect(second.playing()).toBe(true);
  await first.play();
  jest.advanceTimersByTime(100);
  expect(first.playing()).toBe(true);
  expect(Howl.prototype.play).toHaveBeenCalledTimes(2);
});

test('an expired stopBy also cancels starts whose delay has not elapsed', async () => {
  const instance = fixture.create({ delay: 1000, stopBy: 100 });
  await instance.play();
  jest.advanceTimersByTime(1000);
  expect(Howl.prototype.play).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

test('unload is terminal, idempotent and clears all pending requests', async () => {
  const onUnload = jest.fn();
  const instance = fixture.create({ delay: 100, onUnload });
  await instance.play();
  await instance.play();
  await Promise.all([instance.unload(), instance.unload()]);
  await instance.play();
  await instance.stop();
  await instance.pause();
  jest.advanceTimersByTime(1000);
  expect(Howl.prototype.play).not.toHaveBeenCalled();
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  expect(onUnload).toHaveBeenCalledTimes(1);
  expect(listenerCount(instance.howlInst, 'play')).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});
