import type { Howl } from 'howler';

import { Howl as NativeHowl } from 'howler';

import { emit, installHowlerFixture } from './howlerFixture';

type Voice = {
  playing: boolean;
  volume: number;
  fade?: {
    from: number;
    to: number;
    start: number;
    duration: number;
  };
};
type SoundState = {
  voices: Map<number, Voice>;
};

export const installFadeFixture = () => {
  const fixture = installHowlerFixture();
  const sounds = new WeakMap<Howl, SoundState>();
  const events: {
    event: string;
    time: number;
    id?: number;
    duration?: number;
  }[] = [];
  let nextId = 1000;
  const state = (howl: Howl) => {
    let sound = sounds.get(howl);

    if (!sound) {
      sound = { voices: new Map() };
      sounds.set(howl, sound);
    }

    return sound;
  };
  const gain = (voice: Voice) => {
    if (!voice.fade) {
      return voice.volume;
    }

    const {
      from,
      to,
      start,
      duration,
    } = voice.fade;
    const progress = Math.min(1, (Date.now() - start) / duration);

    return from + (to - from) * progress;
  };
  const volumeApi: {
    volume: (...args: number[]) => number | Howl;
  } = NativeHowl.prototype;

  jest.spyOn(volumeApi, 'volume').mockImplementation(function (this: Howl, ...args: number[]) {
    const sound = state(this);

    if (args.length === 0) {
      const volume: unknown = Reflect.get(this, '_volume');

      if (typeof volume !== 'number') {
        throw new Error('Missing Howler group volume');
      }

      return volume;
    }

    if (args.length === 1 && sound.voices.has(args[0])) {
      const voice = sound.voices.get(args[0]);

      if (voice) {
        return gain(voice);
      }
    }

    const [volume, id] = args;

    if (id === undefined) {
      Reflect.set(this, '_volume', volume);
    }

    for (const [voiceId, voice] of sound.voices) {
      if (id === undefined || voiceId === id) {
        voice.volume = volume;
        voice.fade = undefined;
      }
    }

    return this;
  });
  jest.spyOn(NativeHowl.prototype, 'play').mockImplementation(function (this: Howl) {
    nextId += 1;
    state(this).voices.set(nextId, { volume: this.volume(), playing: true });
    events.push({
      event: 'play',
      time: Date.now(),
      id: nextId,
    });
    const soundId = nextId;
    void Promise.resolve().then(() => emit(this, { name: 'play', id: soundId }));

    return nextId;
  });
  jest.spyOn(NativeHowl.prototype, 'playing').mockImplementation(function (this: Howl, id?: number) {
    if (id !== undefined) {
      return state(this).voices.get(id)?.playing ?? false;
    }

    return [...state(this).voices.values()].some((voice) => voice.playing);
  });
  jest.spyOn(NativeHowl.prototype, 'fade').mockImplementation(function (
    this: Howl, ...args: Parameters<Howl['fade']>
  ) {
    const [
      from,
      to,
      duration,
      id,
    ] = args;
    events.push({
      event: 'fade',
      time: Date.now(),
      duration,
      id,
    });

    for (const [voiceId, voice] of state(this).voices) {
      if (id === undefined || id === voiceId) {
        voice.fade = {
          from,
          to,
          duration,
          start: Date.now(),
        };
      }
    }

    return this;
  });
  const controls: Array<'stop' | 'pause'> = ['stop', 'pause'];

  for (const event of controls) {
    jest.spyOn(NativeHowl.prototype, event).mockImplementation(function (this: Howl, id?: number) {
      events.push({
        event,
        time: Date.now(),
        id,
      });

      for (const [voiceId, voice] of state(this).voices) {
        if (id === undefined || id === voiceId) {
          voice.volume = gain(voice);
          voice.fade = undefined;
          voice.playing = false;
          emit(this, { name: event, id: voiceId });
        }
      }

      return this;
    });
  }

  return {
    ...fixture,
    state,
    events,
  };
};
