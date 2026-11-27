import { Howl } from 'howler';

import { store } from '@store';
import { mainActions } from '@store/main';
import { audioEffectsActions } from '@store/effects/audio/audio';

import { BookAudio } from '../BookAudio';

import {
  get,
  navigate,
  onPage,
  owner,
  present,
  range,
  trigger,
  visit,
} from './fixtures';

test('keeps overlapping ranges across direct navigation and creates a new activation after disposal', () => {
  const overlap = range('overlap', { lifetime: { type: 'range', range: [{ from: 3, to: 4 }] } });
  owner.configure([
    onPage('first', 1),
    range('range'),
    overlap,
  ], true);
  const first = get('first');
  const originalRange = get('range');

  navigate(3);
  const originalOverlap = get('overlap');
  expect(first.isUnloading).toBe(true);
  expect(get('range')).toBe(originalRange);
  navigate(4);
  expect(get('overlap')).toBe(originalOverlap);
  expect(originalRange.isUnloading).toBe(true);
  navigate(2);
  expect(originalOverlap.isUnloading).toBe(true);
  expect(get('range')).not.toBe(originalRange);
});

test('replaces a same-ID description with a different source and ignores stale removal', () => {
  owner.configure([range('effect')], true);
  const previous = get('effect');
  owner.configure([range('effect', { src: 'changed.wav' })], true);
  const replacement = get('effect');

  expect(replacement).not.toBe(previous);
  expect(previous.isUnloading).toBe(true);
  store.dispatch(audioEffectsActions.removeAudioInstance({ id: previous.id, instance: previous }));
  expect(get('effect')).toBe(replacement);
});

test('moves pending preparation to the current visit and settles a load failure', async () => {
  jest.spyOn(Howl.prototype, 'state').mockReturnValue('loading');
  owner.configure([range('effect', { playOnLoad: true })], true);
  const audio = get('effect');
  const prepareFirst = visit();
  expect(Object.keys(prepareFirst.pendingResources)).toHaveLength(1);
  present();
  expect(visit().presentedAt).toBeNull();

  navigate(2);
  expect(visit().id).not.toBe(prepareFirst.id);
  expect(get('effect')).toBe(audio);
  expect(Object.keys(visit().pendingResources)).toHaveLength(1);
  await trigger(audio.howlInst, 'loaderror');
  present();
  expect(visit().failedResources).toBe(1);
  expect(visit().presentedAt).not.toBeNull();
  expect(audio.playing()).toBe(false);
});

test('switching books clears a pending request without touching the next book’s same-ID effect', async () => {
  store.dispatch(mainActions.setIsAudioUnlocked(false));
  const description = range('effect', { playOnLoad: true });
  owner.configure([description], true);
  const previous = get('effect');
  const request = jest.spyOn(previous, 'requestPlayback');
  present();

  const nextBookKey = 'next-book';
  store.dispatch(mainActions.openBookSession({
    sessionId: nextBookKey,
    pageIds: ['next'],
    initialPage: 'next',
  }));
  const next = new BookAudio(nextBookKey);
  next.configure([description], true);
  next.start();

  try {
    const replacement = get('effect');
    expect(replacement).not.toBe(previous);
    expect(previous.isUnloading).toBe(true);
    owner.close();
    await trigger(previous.howlInst, 'unlock');
    store.dispatch(mainActions.setIsAudioUnlocked(true));
    present();
    expect(request).not.toHaveBeenCalled();
    expect(get('effect')).toBe(replacement);
    expect(replacement.playing()).toBe(true);
  } finally {
    next.close();
    store.dispatch(mainActions.closeBookSession(nextBookKey));
  }
});
