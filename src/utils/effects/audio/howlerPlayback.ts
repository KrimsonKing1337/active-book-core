import type { Howl } from 'howler';

import { Howler } from 'howler';

export const prepareHowlerPlayback = () => {
  // Howler 2.2.4 can copy WebKit's initial interrupted state and then wait
  // forever for resume. Its normal resume path already handles suspended.
  if (Reflect.get(Howler, 'state') === 'interrupted') {
    Reflect.set(Howler, 'state', 'suspended');
  }
};

export const waitForPlayUnlock = (howl: Howl) => {
  // Howler 2.2.4 queues halt commands while a native start has the play lock.
  const isLocked = () => Reflect.get(howl, '_playLock') === true;

  if (!isLocked()) {
    return;
  }

  let resolve = (_unlocked: boolean) => {};

  const promise = new Promise<boolean>((resolvePromise) => {
    resolve = resolvePromise;
  });

  const settle = (unlocked: boolean) => {
    howl.off('play', handleUnlock);
    howl.off('playerror', handleUnlock);
    howl.off('loaderror', cancel);
    resolve(unlocked);
  };

  const handleUnlock = () => {
    if (!isLocked()) {
      settle(true);
    }
  };

  const cancel = () => settle(false);

  howl.on('play', handleUnlock);
  howl.on('playerror', handleUnlock);
  howl.on('loaderror', cancel);

  return { promise, cancel };
};
