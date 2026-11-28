import { Howl } from 'howler';

import { installFadeFixture } from './fadeFixture';
import { emit } from './howlerFixture';

let fixture: ReturnType<typeof installFadeFixture>;

beforeEach(() => {
  fixture = installFadeFixture();
});

afterEach(() => fixture.restore());

test('shortening holds the current gain and keeps the original completion', async () => {
  const instance = fixture.create();
  await instance.play();
  const fade = instance.fadeOut();
  await jest.advanceTimersByTimeAsync(300);

  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.7, 4);
  expect(instance.shortenFadeOut(100)).toBe(fade);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.7, 4);
  await jest.advanceTimersByTimeAsync(50);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.35, 4);
  expect(instance.shortenFadeOut(100)).toBe(fade);
  await jest.advanceTimersByTimeAsync(49);
  expect(instance.isFading).toBe(true);
  await jest.advanceTimersByTimeAsync(1);
  expect(await fade).toBe(true);
  expect(instance.howlInst.volume(1001)).toBe(0);
  expect(instance.playing()).toBe(true);
  instance.volume(0.5);
  expect(instance.howlInst.volume(1001)).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});

test('a shorter repeated request can finish the same fade immediately', async () => {
  const instance = fixture.create();
  await instance.play();
  const stop = instance.stop(true);
  await jest.advanceTimersByTimeAsync(100);
  const fade = instance.shortenFadeOut(100);
  await jest.advanceTimersByTimeAsync(25);
  expect(instance.shortenFadeOut(0)).toBe(fade);
  expect(await fade).toBe(true);
  await stop;
  expect(instance.playing()).toBe(false);
  await instance.unload();
  await jest.advanceTimersByTimeAsync(0);
  expect(jest.getTimerCount()).toBe(0);
});

test('finishes an overdue fade even when the deadline timer has not run yet', async () => {
  const instance = fixture.create();
  await instance.play();
  const fade = instance.fadeOut();
  instance.shortenFadeOut(100);
  const overdueTime = performance.now() + 101;
  jest.spyOn(performance, 'now').mockReturnValue(overdueTime);

  expect(instance.shortenFadeOut(0)).toBe(fade);
  expect(instance.isFading).toBe(false);
  expect(await fade).toBe(true);
  expect(instance.howlInst.volume(1001)).toBe(0);
});

test('restoring an existing voice cancels the pending stop and never starts a second voice', async () => {
  const instance = fixture.create();
  await instance.play();
  const stop = instance.stop(true);
  await jest.advanceTimersByTimeAsync(400);
  const previousFade = instance.shortenFadeOut(500);
  const restore = instance.restoreFadeIn(200);
  expect(await previousFade).toBe(false);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.6, 4);
  await jest.advanceTimersByTimeAsync(100);
  expect(instance.howlInst.volume(1001)).toBeCloseTo(0.8, 4);
  await jest.advanceTimersByTimeAsync(1000);
  expect(await restore).toBe(true);
  await stop;
  expect(instance.playing()).toBe(true);
  expect(instance.howlInst.volume(1001)).toBe(1);
  expect(Howl.prototype.play).toHaveBeenCalledTimes(1);
  expect(Howl.prototype.stop).not.toHaveBeenCalled();
});

test('force unload settles a retargeted fade and cannot be reversed', async () => {
  const onUnload = jest.fn();
  const instance = fixture.create({ onUnload, fadeOutWhenUnload: true });
  await instance.play();
  const fade = instance.fadeOut();
  await jest.advanceTimersByTimeAsync(300);
  instance.shortenFadeOut(100);
  const restore = instance.restoreFadeIn();
  expect(await fade).toBe(false);

  const unload = instance.unload();
  expect(await instance.restoreFadeIn()).toBe(false);
  expect(instance.unload({ immediate: true })).toBe(unload);
  expect(instance.state()).toBe('unloaded');
  await unload;
  expect(await restore).toBe(false);
  await instance.unload();
  expect(onUnload).toHaveBeenCalledTimes(1);
  expect(Howl.prototype.unload).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

test('a voice ending naturally satisfies a fade to silence', async () => {
  const instance = fixture.create();
  await instance.play();
  const fade = instance.fadeOut();
  const voice = fixture.state(instance.howlInst).voices.get(1001);

  if (!voice) {
    throw new Error('Missing playing voice');
  }

  voice.playing = false;
  emit(instance.howlInst, { name: 'end', id: 1001 });
  await jest.advanceTimersByTimeAsync(0);
  expect(await fade).toBe(true);
  expect(instance.state()).toBe('loaded');
  expect(jest.getTimerCount()).toBe(0);
});
