import { Howl } from 'howler';

import { store } from '@store';
import { mainActions } from '@store/main';

import { emit } from '@utils/effects/audio/tests/howlerFixture';

import {
  advance,
  get,
  navigate,
  onPage,
  owner,
  present,
  range,
  trigger,
} from './fixtures';

test('starts the timeline at the first presented visit and retains both deadlines across navigation', async () => {
  owner.configure([
    range('effect', {
      playOnLoad: true,
      delay: 200,
      stopBy: 800,
    }),
  ], true);
  const audio = get('effect');
  const stop = jest.spyOn(audio, 'stop');
  await advance(1000);
  navigate(2);
  present();
  await advance(199);
  expect(audio.playing()).toBe(false);
  await advance(1);
  expect(audio.playing()).toBe(true);
  await trigger(audio.howlInst, 'play');

  navigate(3);
  present();
  await advance(598);
  expect(audio.playing()).toBe(true);
  await advance(1);
  expect(stop).toHaveBeenCalledTimes(1);
  expect(audio.playing()).toBe(false);
  await audio.play();
  await advance(2000);
  expect(audio.playing()).toBe(true);
  expect(stop).toHaveBeenCalledTimes(1);
});

test.each([100, 200])('stopBy takes priority when delay is %i', async (delay) => {
  owner.configure([
    range('effect', {
      playOnLoad: true,
      delay,
      stopBy: 100,
    }),
  ], true);
  const audio = get('effect');
  const request = jest.spyOn(audio, 'requestPlayback');
  present();
  await advance(250);
  expect(request).not.toHaveBeenCalled();
});

test('late interaction uses the original delay and never starts past stopBy', async () => {
  store.dispatch(mainActions.setIsAudioUnlocked(false));
  const options = {
    playOnLoad: true,
    delay: 200,
    stopBy: 500,
  };
  owner.configure([range('late', options), range('expired', { ...options, stopBy: 250 })], true);
  const late = get('late');
  const expired = get('expired');
  const retry = jest.spyOn(late, 'requestPlayback');
  present();
  await advance(300);

  expect(late.playing()).toBe(false);
  store.dispatch(mainActions.setIsAudioUnlocked(true));
  expect(late.playing()).toBe(true);
  expect(expired.playing()).toBe(false);

  await trigger(late.howlInst, 'play');
  owner.configure([range('late', { ...options, relativeVolume: 50 })], true);
  expect(get('late')).toBe(late);
  expect(late.relativeVolume).toBe(50);
  navigate(2);
  present();
  await trigger(late.howlInst, 'unlock');
  expect(retry).toHaveBeenCalledTimes(1);
});

test('retries a rejected automatic request on unlock and ignores callbacks after session close', async () => {
  const play = jest.spyOn(Howl.prototype, 'play').mockReturnValueOnce(42);
  owner.configure([range('effect', { playOnLoad: true })], true);
  const audio = get('effect');
  present();
  emit(audio.howlInst, { name: 'playerror', id: 42 });
  await advance(1);
  expect(play).toHaveBeenCalledTimes(1);
  await trigger(audio.howlInst, 'unlock');
  expect(play).toHaveBeenCalledTimes(2);
  emit(audio.howlInst, 'unlock');
  owner.close();
  await advance(1000);
  expect(play).toHaveBeenCalledTimes(2);
  expect(audio.isUnloading).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
});

test('stops a manual voice at stopBy and allows another manual start after it', async () => {
  owner.configure([range('effect', { stopBy: 100 })], true);
  const audio = get('effect');
  present();
  await audio.play();
  expect(audio.playing()).toBe(true);
  await advance(100);
  expect(audio.playing()).toBe(false);
  await audio.play();
  await advance(500);
  expect(audio.playing()).toBe(true);
});

test('restoration retains the first presentation deadline and never submits another automatic start', async () => {
  const description = {
    ...onPage('effect', 1),
    playOnLoad: true,
    stopBy: 400,
  };
  owner.configure([description], true);
  const audio = get('effect');
  const request = jest.spyOn(audio, 'requestPlayback');
  const stop = jest.spyOn(audio, 'stop');
  present();
  await trigger(audio.howlInst, 'play');
  await advance(199);
  navigate(2);
  await advance(50);
  navigate(1);
  expect(get('effect')).toBe(audio);
  present();
  await advance(149);
  expect(stop).not.toHaveBeenCalled();
  await advance(1);
  expect(stop).toHaveBeenCalledWith(true);
  expect(request).toHaveBeenCalledTimes(1);
});
