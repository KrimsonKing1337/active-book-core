import { Howl } from 'howler';

import { store } from '@store';
import { mainActions } from '@store/main';
import { volumeActions } from '@store/volume';

import { listenerCount } from '@utils/effects/audio/tests/howlerFixture';

import {
  advance,
  bookKey,
  get,
  navigate,
  onPage,
  owner,
  present,
  visit,
} from './fixtures';

test('retains two fade generations, leaves them unchanged on a silent transition and mixes retired audio', async () => {
  owner.configure([
    onPage('one', 1),
    onPage('two', 2),
    onPage('four', 4),
  ], true);
  const one = get('one');
  const shorten = jest.spyOn(one, 'shortenFadeOut');
  const volume = jest.spyOn(one, 'volume');
  await one.play();
  navigate(2);
  const two = get('two');
  await two.play();
  navigate(3);
  expect(shorten).toHaveBeenCalledWith(100);
  navigate(4);
  expect(shorten).toHaveBeenCalledTimes(1);
  store.dispatch(volumeActions.setSfx(42));
  expect(volume).toHaveBeenCalledWith(0.42);
  await get('four').play();
  navigate(5);
  expect(one.isUnloading).toBe(true);
  expect(two.isUnloading).toBe(false);
  await advance(101);
  expect(two.isUnloading).toBe(true);
});

test('reverses a fade before presentation and ignores a stale fade completion after re-exit', async () => {
  owner.configure([onPage('effect', 1)], true);
  const audio = get('effect');
  const restore = jest.spyOn(audio, 'restoreFadeIn');
  await audio.play();
  navigate(2);
  expect(store.getState().audioEffects.audioInstances.effect).toBeUndefined();
  navigate(1);
  expect(visit().presentedAt).toBeNull();
  expect(get('effect')).toBe(audio);
  expect(restore).toHaveBeenCalledTimes(1);
  navigate(2);
  await advance(1);
  expect(audio.isUnloading).toBe(false);
  await advance(1000);
  expect(audio.isUnloading).toBe(true);
});

test('waitTillTheEnd restores the existing loop and yields to stopBy after exiting again', async () => {
  const loops = new Map<number, boolean>([[1, true]]);
  owner.configure([
    {
      ...onPage('effect', 1),
      waitTillTheEnd: true,
      stopBy: 200,
    },
  ], true);
  const audio = get('effect');
  const fade = jest.spyOn(audio, 'fadeOut');
  function setLoop(state: boolean, id?: number): Howl;
  function setLoop(id?: number): boolean;
  function setLoop(stateOrId?: boolean | number, id?: number) {
    if (typeof stateOrId === 'number') {
      return loops.get(stateOrId) ?? false;
    }

    if (stateOrId === undefined) {
      return false;
    }

    if (id !== undefined) {
      loops.set(id, stateOrId);
    }

    return audio.howlInst;
  }
  jest.spyOn(audio.howlInst, 'loop').mockImplementation(setLoop);

  present();
  await audio.play();
  navigate(2);
  expect(loops.get(1)).toBe(false);
  expect(fade).not.toHaveBeenCalled();
  navigate(1);
  expect(get('effect')).toBe(audio);
  expect(loops.get(1)).toBe(true);
  navigate(2);
  await advance(200);
  expect(fade).toHaveBeenCalledTimes(1);
  await advance(1000);
  expect(audio.isUnloading).toBe(true);
});

test('closes active loading, fading and waiting voices together and releases their subscriptions', async () => {
  owner.configure([
    onPage('fade', 1),
    { ...onPage('wait', 1), waitTillTheEnd: true },
    onPage('loading', 2),
  ], true);
  const fade = get('fade');
  const wait = get('wait');
  await fade.play();
  await wait.play();
  jest.spyOn(Howl.prototype, 'state').mockReturnValue('loading');
  navigate(2);
  const loading = get('loading');
  expect(Object.keys(visit().pendingResources)).toHaveLength(1);

  owner.close();
  expect(Object.keys(visit().pendingResources)).toHaveLength(0);
  store.dispatch(mainActions.closeBookSession(bookKey));
  await advance(1);
  const all = [
    fade,
    wait,
    loading,
  ];
  for (const audioCur of all) {
    expect(audioCur.isUnloading).toBe(true);
    expect(listenerCount(audioCur.howlInst, 'unlock')).toBe(0);
    expect(listenerCount(audioCur.howlInst, 'load')).toBe(0);
  }
  expect(jest.getTimerCount()).toBe(0);
});
