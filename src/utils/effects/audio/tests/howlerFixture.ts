import { Howl } from 'howler';

import type { HowlWrapperOptions } from '../HowlWrapper';

import { HowlWrapper } from '../HowlWrapper';

export const installHowlerFixture = () => {
  const instances: HowlWrapper[] = [];
  const playing = new WeakMap<Howl, boolean>();
  const states = new WeakMap<Howl, ReturnType<Howl['state']>>();
  let soundId = 0;

  jest.useFakeTimers();
  jest.spyOn(Howl.prototype, 'load').mockReturnThis();
  jest.spyOn(Howl.prototype, 'state').mockImplementation(function (this: Howl) {
    return states.get(this) ?? 'loaded';
  });
  jest.spyOn(Howl.prototype, 'duration').mockReturnValue(2);
  jest.spyOn(Howl.prototype, 'fade').mockReturnThis();
  jest.spyOn(Howl.prototype, 'play').mockImplementation(function (this: Howl) {
    playing.set(this, true);
    soundId += 1;

    return soundId;
  });
  jest.spyOn(Howl.prototype, 'playing').mockImplementation(function (this: Howl) {
    return playing.get(this) ?? false;
  });

  const controls: Array<'pause' | 'stop'> = ['pause', 'stop'];

  for (const method of controls) {
    jest.spyOn(Howl.prototype, method).mockImplementation(function (this: Howl) {
      playing.set(this, false);

      return this;
    });
  }

  const nativeUnload = Howl.prototype.unload;
  jest.spyOn(Howl.prototype, 'unload').mockImplementation(function (this: Howl) {
    playing.set(this, false);
    states.set(this, 'unloaded');

    return nativeUnload.call(this);
  });

  const create = (options: Partial<HowlWrapperOptions> = {}) => {
    const instance = new HowlWrapper({
      id: 'audio',
      src: 'audio.wav',
      fadeOutWhenUnload: false,
      ...options,
    });
    instances.push(instance);

    return instance;
  };

  const restore = () => {
    for (const instance of instances) {
      instance.howlInst.off();
      instance.howlInst.unload();
    }

    jest.clearAllTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
  };

  return {
    create,
    restore,
    states,
    playing,
  };
};

// Howler dispatches even already queued callbacks asynchronously; keep its real emitter.
export const emit = (howl: Howl, event: string) => {
  const emitEvent: unknown = Reflect.get(howl, '_emit');

  if (typeof emitEvent !== 'function') {
    throw new Error('Howler emitter is unavailable');
  }

  emitEvent.call(howl, event, 1);
};

export const listenerCount = (howl: Howl, event: string) => {
  const listeners: unknown = Reflect.get(howl, `_on${event}`);

  if (!Array.isArray(listeners)) {
    throw new Error(`Howler listeners for ${event} are unavailable`);
  }

  return listeners.length;
};
