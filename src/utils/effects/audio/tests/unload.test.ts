import { Howl } from 'howler';

import { unloadAudio } from '../unloadAudio';

import { installFadeFixture } from './fadeFixture';
import { installHowlerFixture } from './howlerFixture';

let fixture: ReturnType<typeof installHowlerFixture>;

beforeEach(() => {
  fixture = installHowlerFixture();
  jest.spyOn(Howl.prototype, 'duration').mockReturnValue(0.2);
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

test('short one-shot is released immediately unless waiting is requested', async () => {
  const instance = fixture.create();
  await instance.play();
  await unloadAudio(instance);
  expect(instance.state()).toBe('unloaded');
  expect(jest.getTimerCount()).toBe(0);
});

test('repeated lifetime cleanup does not interrupt or restart the existing unload fade', async () => {
  fixture.restore();
  fixture = installFadeFixture();
  jest.spyOn(Howl.prototype, 'duration').mockReturnValue(0.2);
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
